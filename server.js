require('dotenv').config()
const express = require('express')
const app = express()
const path = require('path')
const ejs = require('ejs')
const expressLayout = require("express-ejs-layouts")
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')(session)
const passport = require('passport')
const Emitter = require('events')
const AdminBro = require('admin-bro')
const AdminBroMongoose = require('@admin-bro/mongoose')
const AdminBroExpress = require('@admin-bro/express')
const fileUpload = require('express-fileupload');
const multiparty = require("multiparty");


const Menu = require('./app/models/menu')
const Order = require('./app/models/order')
const admin = require('./app/http/middleware/admin')

const PORT = process.env.PORT || 8000

// connecting to Database
const url = 'mongodb://localhost/cake';
mongoose.connect(url, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, useFindAndModify: false });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database connected...');
}).catch(err => {
    console.log('connection Failed...');
});


// Session store
let mongoStore = new MongoDbStore({
    mongooseConnection: connection,
    collection: 'sessions'
})

// Event Emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)


// default options
app.use(fileUpload())

// Sessions config    
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }
    // cookie: {maxAge: 1000 * 10} // It will expire in 15 sec
}))

// Passport config
const passportInit = require('./app/config/passport')
const { log } = require('console')
const { link } = require('fs')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

// Assets
app.use(express.static('./public/'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json())


// Global middleware
app.use((req, res, next) => {
    res.locals.session = req.session
    res.locals.user = req.user
    next()
})

// Template Engine
app.use(expressLayout)
app.set('views', path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

// Routes
require('./routes/web')(app)

//Admin Bro
AdminBro.registerAdapter(AdminBroMongoose)
const User = mongoose.model('User', { name: String, email: String })
const Orders = mongoose.model('order', { customerId: mongoose.Schema.Types.ObjectId, phone: String, address: String, paymentType: String, status: String })
const AdminBroOptions = {
    resources: [User, {
        resource: Menu,
        options: {
            sort: {
                direction: 'asc',
                sortBy: 'name',
            },
        },
    }, {
            resource: Orders,
            options: {
                sort: {
                    direction: 'asc',
                    sortBy: 'phone',
                },
            },
        }
    ], branding: {
        logo: '/img/logo.jpeg',
        companyName: 'admin.Baketion.com',
        softwareBrothers: false,
        favicon: '/img/cupca.png',
    },
    //   dashboard: { 
    //     handler: {

    //     },
    //     component: tring,
    //   }
}
const adminBro = new AdminBro(AdminBroOptions)
const router = AdminBroExpress.buildRouter(adminBro)
app.use(adminBro.options.rootPath, router).admin


// Listening to Server
const server = app.listen(PORT, (req, res) => {
    console.log(`Listining on PORT ${PORT}`)
})

// Socket
const io = require('socket.io')(server)
io.on('connection', (socket) => {
    // Join
    socket.on('join', (orderId) => {
        socket.join(orderId)
    })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
    // io.to('adminRoom').emit('orderRoom', data)
})