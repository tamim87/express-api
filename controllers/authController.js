const bcrypt = require("bcrypt");
const jst = require("jsonwebtoken");
const pool = require("../config/db");
const { validationResult } = require("express-validator");

const JWT_SECRET = process.env.JWT_SECRET;

