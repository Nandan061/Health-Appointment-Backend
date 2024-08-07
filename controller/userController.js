import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

// Patient Registration
export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password, message } = req.body;

  if (!firstName || !lastName || !email || !phone || !nic || !dob || !gender || !password) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler("User already Registered!", 400));
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    message,
    role: "Patient",
  });

  generateToken(user, "User Registered!", 200, res);
});

// Login
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, confirmPassword, role } = req.body;

  if (!email|| !password || !confirmPassword || !role) {
    console.log(req.body);
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Password & Confirm Password Do Not Match!", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid Email Or Password!", 400));
  }
  if (role !== user.role) {
    return next(new ErrorHandler(`User Not Found With This Role!`, 400));
  }

  generateToken(user, "Login Successfully!", 201, res);
});

// Add New Admin
export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, nic, dob, gender, password, message } = req.body;

  if (!firstName || !lastName || !email || !phone || !nic || !dob || !gender || !password) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler(`${isRegistered.role} Admin With This Email Already Exists!`, 400));
  }

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    role: "Admin",
    password,
    message,
  });

  res.status(200).json({
    success: true,
    message: "New Admin Registered",
    admin,
  });
});

// Add New Doctor
export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Doctor Avatar Required!", 400));
  }

  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype)) {
    return next(new ErrorHandler("File Format Not Supported!", 400));
  }

  const {
     firstName,
     lastName,
     email, phone,
     nic,
     dob,
     gender,
     password,
     doctorDepartment,
     message
    } = req.body;

  if (
    !firstName || !lastName || !email || !phone || !nic || !dob || !gender || !password || !doctorDepartment || !message) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered) {
    return next(new ErrorHandler(`${isRegistered}Doctor With This Email Already Exists!`, 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error("Cloudinary Error:", cloudinaryResponse.error || "Unknown Cloudinary error"
    );
    return next(new ErrorHandler("Failed To Upload Doctor Avatar To Cloudinary", 500));
  }

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    nic,
    dob,
    gender,
    password,
    role: "Doctor",
    doctorDepartment,
    message,
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  res.status(200).json({
    success: true,
    message: "New Doctor Registered",
    doctor
  });
});

// Get All Doctors
export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({
    success: true,
    doctors,
  });
});

// Get User Details
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

// Logout for Dashboard Admin
export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", { // Changed from adminToken to token
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Admin Logged Out Successfully.",
    });
});

// Logout for Frontend Patient
export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", { // Changed from patientToken to token
      httpOnly: true,
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: "Patient Logged Out Successfully.",
    });
});
