const express=require('express');
const { getCourses, postCourses } = require('../../controllers/courses.controller');
const router = express.Router();


router.route('/').get(getCourses).post(postCourses)

  module.exports=router;