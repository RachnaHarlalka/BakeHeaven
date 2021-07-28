const Order = require('../../../models/order')
// const popup = require('popups')
const moment = require('moment')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

let regex = /^0?[6-9][\d]{9}$/;
function orderController() {
    return {
        store(req, res) {
            // Validate Request
            const { phone, address, customize, check, stripeToken, paymentType } = req.body
            if (!phone || !address) {
                return res.status(422).json({ message: 'All fields are required' });

            } else if (!check) {
                return res.status(422).json({ message: 'Please agree to the condition' });

            }
            else if (!phone.match(regex)) {
                return res.status(422).json({ message: 'Invalid phone number' });

            }
            const order = new Order({
                customerId: req.user._id,
                items: req.session.cart.items,
                phone: phone,
                customize: customize,
                address: address,
            })
            order.save().then(result => {
                Order.populate(result, { path: 'customerId' }, (err, placedOrder) => {
                    // req.flash('success', 'Order placed successfully')


                    //Stripe payment
                    if (paymentType === 'card') {
                        stripe.charges.create({
                            amount: req.session.cart.totalPrice * 100,
                            source: stripeToken,
                            currency: 'inr',
                            description: `Cake Order : ${placedOrder._id}`
                        }).then(() => {
                            placedOrder.paymentStatus = true;
                            placedOrder.paymentType = paymentType
                            placedOrder.save().then((ord) => {
                                //Emit
                                const eventEmitter = req.app.get('eventEmitter')
                                eventEmitter.emit('orderplaced', ord)
                                delete req.session.cart

                                return res.json({ message: 'Payment successful,Order placed successfully' });

                            }).catch((err) => {

                                console.log(err)
                            })
                        }).catch((err) => {
                            delete req.session.cart
                            return res.json({ message: 'Order Placed but payment failed, You can pay at delivery time' });

                        });
                    } else {
                        delete req.session.cart
                        placedOrder.paymentType = paymentType

                        return res.json({ message: 'Order placed successfully' });

                    }
                })
            }).catch(err => {
                return res.status(500).json({ message: 'Something went wrong' });


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