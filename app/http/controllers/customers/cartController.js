const { json } = require("express")
const Menu = require('../../../models/menu')
function cartController() {
  return {
    index(req, res) {
      res.render('customers/cart')
    },
    async delete(req, res) {
      const menuId = req.query.id;

      req.session.cart.totalQty -= req.session.cart.items[menuId].qty;
      req.session.cart.totalPrice -= req.session.cart.items[menuId].item.price * req.session.cart.items[menuId].qty;

      delete req.session.cart.items[menuId];

      res.status(302).redirect('/cart')
    },
    update(req, res) {
      // if (req.session.passport.user === req.user.id) {

      // Create cart if theres no cart in the session
      if (!req.session.cart) {
        req.session.cart = {
          items: {},
          totalQty: 0,
          totalPrice: 0
        }
      }
      let cart = req.session.cart

      //check if item does not exist in cart.
      if (!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
          item: req.body,
          qty: 1
        }
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
      } else { // if item exist in the cart
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1
        cart.totalQty = cart.totalQty + 1
        cart.totalPrice = cart.totalPrice + req.body.price
      }
      return res.json({ totalQty: req.session.cart.totalQty })

    },
    async incrementCart(req, res) {
      const menuId = req.query.id;
      var cart = req.session.cart

      cart.items[menuId].qty = cart.items[menuId].qty + 1
      req.session.cart.totalQty += 1
      req.session.cart.totalPrice += req.session.cart.items[menuId].item.price;

      req.session.cart = cart;
      res.status(302).redirect('/cart')
    },
    async decrementCart(req, res) {
      const menuId = req.query.id;
      var cart = req.session.cart

      req.session.cart.totalQty -= 1;
      req.session.cart.totalPrice -= req.session.cart.items[menuId].item.price;

      if (cart.items[menuId].qty > 1) {
        cart.items[menuId].qty = cart.items[menuId].qty - 1
      }
      else {
        delete req.session.cart.items[menuId];
      }

      req.session.cart = cart;
      res.status(302).redirect('/cart');
    },




  }
}

module.exports = cartController