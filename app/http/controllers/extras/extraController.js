function extraController() {
    return {
        privacy(req, res) {
            res.render('extras/privacy')
        },
        locate(req, res) {
            res.render('extras/locate')
        }
    }
}
module.exports = extraController