const Order = require('../../../models/order')
// const popup = require('popups')
const moment = require('moment')

let regex = /^0?[6-9][\d]{9}$/;
function orderController() {
    return {
        store(req, res) {
            // Validate Request
            const { phone, address, customize, check } = req.body
            if (!phone || !address) {
                req.flash('error', 'All fields are required')
                return res.redirect('/cart')
            } else if (!check) {
                req.flash('error', 'Please agree to the condition')
                return res.redirect('/cart')
            }
            else if (!phone.match(regex)) {
                req.flash('error', 'Invalid phone number')
                return res.redirect('/cart')
            }
            console.log("test", req.body)
            const order = new Order({
                customerId: req.user._id,
                items: req.session.cart.items,
                phone: phone,
                customize: customize,
                address: address,
            })
            order.save().then(result => {
                Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
                    req.flash('success', 'Order placed successfully')
                    delete req.session.cart
                    // Emit event
                    const eventEmitter = req.app.get('eventEmitter')
                    eventEmitter.emit('orderplaced', placedOrder)
                    return res.redirect('/customer/orders')
                })
            }).catch(err => {
                req.flash('error', 'Something went wrong')
                return res.redirect('/cart')
            })
        },
        async index(req, res) {
            const orders = await Order.find(
                { customerId: req.user._id },
                null,
                { sort: { 'createdAt': -1 } }
            ).populate('name')
            console.log(orders)
            res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-chech=0, pre-check=0')
            res.render('customers/orders', { orders: orders, moment: moment })
        },
        async show(req, res) {
            const order = await Order.findById(req.params.id)
            if (req.user._id.toString() === order.customerId.toString()) {
                return res.render('customers/singleOrder', { order: order })
            }
            return res.redirect('/')
        },
        detail(req, res) {
            res.render('product/productDetails')
        },
    }
}

module.exports = orderController