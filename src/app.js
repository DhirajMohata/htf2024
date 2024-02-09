// E-Complaints
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
const nodemailer = require('nodemailer');
const passport = require('passport')
const compression = require('compression')
const MongoStore = require('connect-mongo')(session)
const { Complaint } = require('../models/complaint')


const app = express()
// prevent stack traces on production
app.set('env', process.env.NODE_ENV)

// Middleware to Handle Post request
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(compression())

// Define paths for views and public dir
const publicDirectoryPath = path.join(__dirname, '../public')
const viewsDirectoryPath = path.join(__dirname, '../views')

// Set path for views and public directory
app.set('views', viewsDirectoryPath)
app.use(express.static(publicDirectoryPath))

// Ejs Engine
app.set('viewengine', 'ejs')

// connecting db
mongoose
  .connect(process.env.DATABASE_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to database successfully...'))
  .catch((err) => console.log('Failed to connect to database', err))

// Express session middleware
app.use(
  session({
    secret: 'secretKey',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true },
    store: new MongoStore({ mongooseConnection: mongoose.connection })
  })
)

// Express flash message middleware
app.use(flash())
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  res.locals.error = req.flash('error') // login passport.js msg
  next()
})

// passport config
require('../middleware/passport.js')(passport)

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// setting global variable for every view as middleware function to check whether user is logged in or not
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated()
  next()
})

// Routes
const homeRouter = require('../routes/index')

app.use(homeRouter)

const complaintRouter = require('../routes/complaints')

app.use(complaintRouter)

const feedbackRouter = require('../routes/feedback')

app.use('/feedback', feedbackRouter)

const userRouter = require('../routes/users')

app.use('/users', userRouter)

const adminRouter = require('../routes/admin')

app.use('/admin', adminRouter)

const staffRouter = require('../routes/staff')

app.use('/staff', staffRouter)

const errorRouter = require('../routes/404')

app.use(errorRouter)

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
      user: 'turbogeek641@gmail.com',
      pass: 'vcle vjly tzln yznv'
  }
});

const verifie = 
  [
    {"JZRM5981" : "mohatadhruv@gmail.com"},
    {"JZRM5982" : "dhirajmohata86@gmial.com"},
    {"JZRM5983" : "mohatadhruv@gmail.com"},
    {"JZRM5984" : "mohatadhruv@gmail.com"},
    {"JZRM5985" : "mohatadhruv@gmail.com"},
    {"JZRM5986" : "dhirajmohata86@gmial.com"},
    {"JZRM5987" : "mohatadhruv@gmail.com"},
    {"JZRM5988" : "dhirajmohata86@gmial.com"},
    {"JZRM5989" : "mohatadhruv@gmail.com"},
    {"JZRM5990" : "dhirajmohata86@gmial.com"}
  ];

  app.post('/staff/complaints/temp', async (req, res) => {
    try {
      const complaints = await Complaint.findById({ _id: req.body.complaint});
  
      var ml;
      for (const obj of verifie) {
        for (const key in obj) {
          if (key === complaints.citizenship) {
            ml = obj[key];
            break;
          }
        }
      }

      await Complaint.updateOne(
        { _id: req.body.complaint },
        { $set: { feedback: req.body.feedback, status: 'InProgress' } }
      )
  
      console.log(req.body.feedback);
  
      const mailOptions = {
        from: 'turbogeek641@gmail.com',
        to: 'pandeyjee2310@gmail.com',
        subject: req.body.feedback,
        text: req.body.feedback
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log('Error sending email: ' + error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
  
      res.redirect('/staff/dashboard');
    } catch (error) {
      console.error('Error fetching complaint ID: ' + error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.post('/feedback/reopen', async (req, res) => {
    await Complaint.updateOne(
      { _id: req.body.complaintId },
      { $set: {status: 'Reopen' } }
    )
    const mailOptions = {
      from: 'turbogeek641@gmail.com',
      to: 'pandeyjee2310@gmail.com',
      subject: "Your problem has been reopened",
      text:  "Your problem has been reopened"
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email: ' + error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    await req.flash('success_msg', 'Your Complaint Has Been Reopened')
    res.redirect('/admin/complaints')
  });

const hostname = 'localhost'
const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
