module.exports.getCourses=(req, res,next) => {
    const {ip,query,params,body,headers}=req;
     console.log(ip,query,params,body,headers);
     res.send('got it')
  };
module.exports.postCourses=(req, res) => {
    res.send('post successfull');
  }