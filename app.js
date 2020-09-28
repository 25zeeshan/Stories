const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const morgan = require('morgan');


const passport = require('passport');

require('dotenv').config();

require('./config/passport')(passport);

const app = express();
const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: false }))
app.use(express.json());

//method-override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      let method = req.body._method
      delete req.body._method
      return method
    }
}))

//logging
app.use(morgan('dev'));

const { formatDate, stripTags, truncate, editIcon, select } = require('./helpers/hbs');

//handlebars
app.engine('.hbs', exphbs({ helpers: { formatDate, stripTags, truncate, editIcon, select }, defaultLayout: 'main' ,extname: '.hbs' }));
app.set('view engine', '.hbs');

//sessions
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection })
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

//set global variable
app.use(function(req, res, next) {
    res.locals.user = req.user || null;
    next();
})

app.use(express.static(path.join(__dirname, 'public')));


app.use('/',require('./routes/index'));
app.use('/auth',require('./routes/auth'));
app.use('/stories',require('./routes/stories'));
app.use(express.json());

const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true})
    .then(() => console.log("db connected"))
    .catch((err) => console.log(err))

const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB connection established securely");
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});