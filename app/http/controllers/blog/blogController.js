function blogController() {
    return {
        index(req, res) {
            res.render('blog/cakeblog')
        },
        firstblog(req, res) {
            res.render('blog/firstblog')
        },
        secondblog(req, res) {
            res.render('blog/secondblog')
        }
    }
}

module.exports = blogController