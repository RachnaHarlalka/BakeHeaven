const Order = require('../../../models/order')

function statusController() {
    return {
        update(req, res) {
            Order.updateOne({ _id: req.body.orderId }, { status: req.body.status }, (err, data) => {
                if (err) {
                    return res.redirect('/admin/orders')
                }
                if (req.body.status === 'delivered') {
                    req.body.paymentStatus = true;
                }
                const eventEmitter = req.app.get('eventEmitter')
                eventEmitter.emit('orderUpdated', { id: req.body.orderId, status: req.body.status })
                res.redirect('/admin/orders')
            })
        }
    }
}

module.exports = statusController