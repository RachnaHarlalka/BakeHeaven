const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')
const session = require('express-session')
const admin = require('../middleware/admin')
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const dotenv = require('dotenv').config()

const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
function authController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : '/'
    }
    return {
        login(req, res) {
            res.render('auth/login')
        },
        postLogin(req, res, next) {
            // validating
            const { email, password } = req.body
            if (!email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }
            // Login Logic
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    req.flash('error', info.message)
                    return next(err)
                }
                if (!user) {
                    req.flash('error', info.message)
                    return res.redirect('/login')
                }
                req.login(user, (err) => {
                    if (err) {
                        req.flash('error', info.message)
                        return next(err)
                    }
                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register')
        },
        async postRegister(req, res) {
            const { name, email, password, confirm, role } = req.body
            // Validate Request
            if (!name || !email || !password || !confirm) {
                req.flash('error', 'All fields are required')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register')
            } else if (!email.match(regex)) {
                req.flash('error', 'Email format incorrect')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register');
            }
            else if (req.body.password !== req.body.confirm) {
                req.flash('error', 'Password do not match')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register');
            }
            // Check if email exists
            User.exists({ email: email }, (err, result) => {
                if (result) {
                    req.flash('error', 'Email already taken')
                    req.flash('name', name)
                    req.flash('email', email)
                    return res.redirect('/register')
                }
            })

            const hashedPassword = await bcrypt.hash(password, 10)

            // Creating user in DB if everything is alright
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword,
                role: role
            })
            user.save().then((user) => {
                return res.redirect('/')
            }).catch(err => {
                req.flash('error', 'Something went wrong')
                return res.redirect('/')
            })
        },
        logout(req, res) {
            req.logout();
            req.session.destroy();
            return res.redirect('/login')
        },
        forgot(req, res) {
            res.render('auth/forgot');
        },
        postForgot(req, res) {
            async.waterfall([
                function (done) {
                    crypto.randomBytes(20, function (err, buf) {
                        var token = buf.toString('hex');
                        done(err, token);
                    });
                },
                function (token, done) {
                    const { email } = req.body
                    if (!email.match(regex)) {
                        req.flash('error', 'Email format incorrect')
                        return res.redirect('/forgot');
                    }

                    User.findOne({ email: req.body.email }, function (err, user) {
                        if (!user) {
                            req.flash('error', 'No account with that email address exists.');
                            return res.redirect('/forgot');
                        }

                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 1800000; // 1 hour

                        user.save(function (err) {
                            done(err, token, user);
                        });
                    });
                },
                function (token, user, done) {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'rachnaag1999@gmail.com',
                            pass: process.env.GMAILPW
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'rachnaag1999@gmail.com',
                        subject: 'Node.js Password Reset',
                        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        console.log('mail sent');
                        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                        done(err, 'done');
                    });
                }
            ], function (err) {
                if (err) {
                    console.log("postForgot error", err)
                }
                res.redirect('/forgot');
            });
        },
        resetToken(req, res) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('/forgot');
                }
                res.render('auth/reset', { token: req.params.token });
            });
        },
        postResetToken(req, res) {
            var newUser = {};
            async.waterfall([
                function (done) {
                    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                        // console.log("user", user)
                        if (user) {
                            newUser = user;
                        }
                        if (!user) {
                            req.flash('error', 'Password reset token is invalid or has expired.');
                            return res.redirect('back');
                        }
                        if (req.body.password === req.body.confirm) {
                            user.setPassword(req.body.password, async function (err) {
                                user.resetPasswordToken = undefined;
                                user.resetPasswordExpires = undefined;
                                user.save(function (err, result) {
                                    req.flash('success', 'Success! Your password has been changed.');

                                    res.redirect('/login');
                                });

                                const hashedPassword = await bcrypt.hash(req.body.password, 10)

                                newUser.password = hashedPassword;

                                // testing for update
                                User.findByIdAndUpdate(newUser._id, newUser).then((response) => {
                                    req.flash('success', 'Success! Your password has been changed.');

                                    res.redirect('/login');
                                }).catch((err) => {


                                });
                            })
                        } else {
                            req.flash("error", "Passwords do not match.");
                            return res.redirect('back');
                        }
                    });
                },
                function (user, done) {
                    var smtpTransport = nodemailer.createTransport({
                        service: 'Gmail',
                        auth: {
                            user: 'rachnaag1999@gmail.com',
                            pass: process.env.GMAILPW
                        }
                    });
                    var mailOptions = {
                        to: user.email,
                        from: 'rachnaag1999@mail.com',
                        subject: 'Your password has been changed',
                        text: 'Hello,\n\n' +
                            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        req.flash('success', 'Success! Your password has been changed.');
                        res.redirect('/');
                        done(err);
                    });
                }

            ], function (err) {
                res.redirect('/');
            });
        }
    }
}

module.exports = authController