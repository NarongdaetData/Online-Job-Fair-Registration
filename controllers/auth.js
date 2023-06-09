const User = require("../models/User");


const sendTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken();
  console.log(token)
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  res.status(statusCode)/*.cookie("token", token, options)*/.json({
    success: true,
    //add for frontend
    _id: user._id,
    name: user.name,
    email: user.email,
    //end for frontend
    token,
  });
};

//@desc Register user
//@route GET/api/v1/auth/register
//@access Public
exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, confirmpassword, role } = req.body;

    // Inactivity timeout session
    const sessionTimeout = 600000; // 10 minutes in milliseconds
    let lastActivityTime = Date.now();
    let timeoutID;
    const clearSessionTimeout = () => clearTimeout(timeoutID);
    const setSessionTimeout = () => {
      lastActivityTime = Date.now();
      timeoutID = setTimeout(() => {
        res.status(401).json({ success: false, message: "Timeout of inactivity. Please re-register." });
      }, sessionTimeout - (Date.now() - lastActivityTime));
    };
    setSessionTimeout();

    //Create user
    if (password != confirmpassword) {
      return res.status(400).json({ success: false, message: `password not match with the comfirmpassword` })
    }
    const user = await User.create({
      name,
      tel,
      email,
      password,
      role,
    });
    //Create token
    sendTokenResponse(user, 200, res);

    // Refresh session timeout when a new request is received
    req.on('data', () => {
      clearSessionTimeout();
      setSessionTimeout();
    });

  } catch (err) {
    res.status(400).json({ success: false, message: `Invalid Input` });
    console.log(err.stack);
  }
};

//@desc Login user
//@route POST /api/v1/auth/login
//@access Public
exports.login = async (req, res, next) => {

  try {
    const { email, password } = req.body;
    //Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Please provide an email and password",
      });
    }
    //Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({
        success: false,
        msg: "Invalid credentials",
      });
    }
    //Check if password matches

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        msg: "Invalid credentials",
      });
    }
    //Create token
    //const token=user.getSignedJwtToken() ;
    //res.status(200).json ({success:true,token});
    sendTokenResponse(user, 200, res);
  } catch (err) {
    return res.status(401).json({ success: false, msg: 'Cannot convert email or password to string' });
  }
};

//Get token from model, create cookie and send response

//At the end of file
//@desc Get current Logged in user
//@route POST /v1/auth/me
//@access Private

exports.getMe = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
};

//@desc Log user out / clear cookie
//@route GET /v1/auth/logout
//@access Private

exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now(+10 * 60 * 100)),
    httpOnly: true
  })
  res.status(200).json({
    success: true,
    data: {}
  });
};