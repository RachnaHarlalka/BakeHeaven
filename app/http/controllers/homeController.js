const Category = require('../../models/category');
const Menu = require('../../models/menu');
const Contact = require('../../models/contact')
const nodemailer = require("nodemailer");
const dotenv = require('dotenv').config()

const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

function homeController() {
    return {
        async index(req, res) {
            const search = req.query.search || "";
            const categoryId = req.query.categoryId || "";
            const menus = await Menu.find({ name: new RegExp(search.toString(), "i"), categoryId: new RegExp(categoryId.toString(), "i") })
            const categories = await Category.find();
            return res.render('home', { menus: menus, categories: categories, search: search, categoryId: categoryId }) // 1st is key and 2nd is cakes received from database
        },
        deleteContact(req, res) {
            const contact = req.query.id;
            Contact.findByIdAndRemove(contact).then(() => {
                res.redirect('/dashboard/viewContact');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            })
        },

        contact(req, res) {
            res.render('contact')
        },
        postContact(req, res) {
            const { name, email, message } = req.body
            // Validate Request
            if (!name || !email || !message) {
                req.flash('error', 'All fields are required!!')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/contact')
            } else if (!email.match(regex)) {
                req.flash('error', 'Email format incorrect!!')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/contact');
            }
            const contact = new Contact({
                name: name,
                email: email,
                message: message
            })
            contact.save().then((contact) => {
                req.flash('success', 'An e-mail has been sent');

                return res.redirect('/contact')
            }).catch(err => {
                req.flash('error', 'Something went wrong')
                return res.redirect('/contact')
            })


            console.log("Contact form called")
            const output = `
            <p>You have a new message/Feedback</p>
            <h3>Contact Details</h3>
            <ul>
                <li>Name : ${req.body.name}</li>
                <li>Email : ${req.body.email}</li>
            </ul>
            <h3>Message</h3>
            <p>${req.body.message}</p>
            `;
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'rachnaag1999@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            let mailOptions = {
                to: 'rachnaharlalka12345@gmail.com',
                from: 'rachnaag1999@gmail.com',
                subject: 'BakeHeaven Contact request',
                text: 'Hello world',
                html: output
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                // console.log('mail sent');
                req.flash('success', 'An e-mail has been sent');
                return res.redirect('/home')

            });
            console.log(req.body)

        }

    }
}

module.exports = homeController