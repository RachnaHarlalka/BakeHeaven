const Category = require('../../../models/category');
const User = require('../../../models/user');
const Menu = require('../../../models/menu');
const Contact = require('../../../models/contact');
const bcrypt = require('bcrypt')
const Order = require('../../../models/order')
const formatDate = require('../../../utils/formatDate')
const moment = require('moment')

const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

function dashController() {
    return {
        async admin(req, res) {
            const admins = await User.find({ role: "admin" });
            console.log(admins)

            res.render('admin/viewAdmin', { admins: admins })
        },
        async customer(req, res) {
            const customers = await User.find({ role: "customer" });
            res.render('admin/viewCustomer', { customers: customers })
        },
        async updateAdmin(req, res) {
            const adminId = req.query.id;
            const admin = await User.findById(adminId);
            return res.render('admin/addAdmin', { loggedInAdmin: admin });
        },
        deleteAdmin(req, res) {
            const adminId = req.query.id;
            User.findByIdAndRemove(adminId).then(() => {
                res.redirect('/dashboard/viewAdmin');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            })
        },
        deleteCustomer(req, res) {
            const customerId = req.query.id;
            User.findByIdAndRemove(customerId).then(() => {
                res.redirect('/dashboard/viewCustomer');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            })
        },
        addAdmin(req, res) {
            res.render('admin/addAdmin', { loggedInAdmin: null });
        },
        async postAddAdmin(req, res) {

            const data = req.body;
            if (!data.name || !data.email || !data.password) {
                req.flash('error', 'All fields are required')
                req.flash('name', data.name)
                req.flash('email', data.email)
                return res.redirect('/dashboard/addAdmin')
            }
            else if (!data.email.match(regex)) {
                req.flash('error', 'Email format incorrect')
                req.flash('name', data.name)
                req.flash('email', data.email)
                return res.redirect('/dashboard/addAdmin');
            }
            User.exists({ email: data.email }, (err, result) => {
                if (result) {
                    return res.redirect('/dashboard/viewAdmin')
                }
            })

            data.password = await bcrypt.hash(data.password, 10)

            User.create(data).then(() => {
                return res.redirect('/dashboard/viewAdmin')
            }).catch(err => {
                req.flash('error', 'Something went wrong')
                return res.redirect('/dashboard/viewAdmin')
            });
        },
        postUpdateAdmin(req, res) {
            const data = req.body;

            User.findByIdAndUpdate(data.id, data).then(() => {
                res.redirect('/dashboard/viewAdmin');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            });


        },
        adminDash(req, res) {
            res.render('admin/dashboard');
        },
        addCategory(req, res) {
            res.render('admin/addCategory', { category: null });
        },
        postAddCategory(req, res) {
            const data = req.body;
            req.files.image.mv(process.cwd() + '/public/img/category/' + req.files.image.name).finally(() => {
                Category.create({ ...data, image: req.files.image.name }).then(() => {
                    res.redirect('/dashboard/viewCategory');
                }).catch((err) => {
                    console.error(err);
                    res.send({ message: "Something went wrong" });
                })
            })
        },
        postUpdateCategory(req, res) {
            const data = req.body;

            const updateData = (category) => Category.findByIdAndUpdate(data.id, category).then(() => {
                res.redirect('/dashboard/viewCategory');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            });

            if (req.files) {
                req.files.image.mv(process.cwd() + '/public/img/category/' + req.files.image.name).finally(() => {
                    updateData({ ...data, image: req.files.image.name });
                })
            }
            else {
                updateData({ ...data });
            }
        },
        async updateCategory(req, res) {
            const categoryId = req.query.id;
            const category = await Category.findById(categoryId);
            return res.render('admin/addCategory', { category: category });
        },
        deleteCategory(req, res) {
            const categoryId = req.query.id;
            Category.findByIdAndRemove(categoryId).then(() => {
                res.redirect('/dashboard/viewCategory');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            })
        },
        async viewContact(req, res) {
            const contacts = await Contact.find()
            return res.render('admin/viewContact', { contacts: contacts });

        },
        async viewCategory(req, res) {
            const categories = await Category.find()
            return res.render('admin/viewCategory', { categories: categories });
        },
        async addMenu(req, res) {
            const categories = await Category.find();
            res.render('admin/addMenu', { categories: categories, menu: null });
        },
        postAddMenu(req, res) {
            const data = req.body;

            req.files.image.mv(process.cwd() + '/public/img/menu/' + req.files.image.name).finally(() => {
                Menu.create({ ...data, image: req.files.image.name }).then(() => {
                    res.redirect('/dashboard/viewMenu');
                }).catch((err) => {
                    console.error(err);
                    res.send({ message: "Something went wrong" });
                })
            })
        },
        postUpdateMenu(req, res) {
            const data = req.body;

            const updateData = (menu) => Menu.findByIdAndUpdate(data.id, menu).then(() => {
                res.redirect('/dashboard/viewMenu');
            }).catch((err) => {
                console.error(err);
                res.send({ message: "Something went wrong" });
            });

            if (req.files) {
                req.files.image.mv(process.cwd() + '/public/img/menu/' + req.files.image.name).finally(() => {
                    updateData({ ...data, image: req.files.image.name });
                })
            }
            else {
                updateData({ ...data });
            }
        },
        async viewMenu(req, res) {
            const menu = await Menu.find()
            return res.render('admin/viewMenu', { menu: menu });
        },
        async deleteMenu(req, res) {
            const menuId = req.query.id;
            Menu.findByIdAndDelete(menuId).then(() => {
                res.status(302).redirect('/dashboard/viewMenu');
            }).catch((err) => {
                console.log(err);
                res.send({ message: "Something went wrong" });
            })
        },
        async updateMenu(req, res) {
            const menuId = req.query.id;
            const menu = await Menu.findById(menuId);
            const categories = await Category.find();
            res.render('admin/addMenu', { categories: categories, menu: menu });
        },
        async deleteOrders(req, res) {
            const orderId = req.query.id;
            Order.findByIdAndDelete(orderId).then(() => {
                res.status(302).redirect('/dashboard/allOrders');
            }).catch((err) => {
                console.log(err);
                res.send({ message: "Something went wrong" });
            })
        },
        async showAllOrders(req, res) {
            const orders = await Order.find();
            // const newOrder = changeOrder(orders);
            // console.log("new order", )
            // res.render('admin/allOrders', { });

            // res.render('admin/allOrders', { orders: orders, formatDate: formatDate });
            res.render('admin/allOrders', { orders: orders, moment: moment });

        },
    }
}

// function changeOrder(orders) {
//     var test = {};

//     const newOrders = orders.map((order) => {
//         var date = formatDate(order.createdAt);
//         test = {
//             'date': date
//         }
//         order.create(date)
//         console.log(typeof order)
//         console.log(order)
//         return order;

//     })
//     console.log("test", test);

// }

module.exports = dashController;