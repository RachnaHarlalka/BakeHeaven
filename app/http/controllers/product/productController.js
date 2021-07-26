const Menu = require('../../../models/menu')


function productController() {
    return {
        async show(req, res) {
            const menuId = req.query.id;
            const menu = await Menu.findById(menuId);
            res.render('product/productDetails', { menu: menu });
        },

    }
}

module.exports = productController