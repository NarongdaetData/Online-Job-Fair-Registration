const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss=require('xss-clean')
const rateLimit=require('express-rate-limit')
const hpp=require('hpp');

//Route files
const auth = require('./routes/auth.js');
const companies = require('./routes/companies.js');

//Load env vars
dotenv.config({path:'./config/config.env'});

//Connect to database
connectDB();

const app = express();



app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(rateLimit({
    windowsMs: 10*60*1000,//10 mins
    max:100
}
));
app.use(hpp());

//Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/companies', companies);
//end Mount routers


const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, console.log('Server running in ', process.env.NODE_ENV, 'mode on port ', PORT));

//Handle unhandled promise rejections
process.on('unhandledRejection',(err,promise)=>{
    console.log( `Error: ${err.message}`);
    //Close server & exit process
    server.close(()=>process.exit(1));
    });