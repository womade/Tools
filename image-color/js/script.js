  //截取上传文件的后缀
  let suffix = /(\.*.jpg$)|(\.*.png$)|(\.*.jpeg$)|(\.*.bmp$)|(\.*.JPG$)|(\.*.PNG$)|(\.*.JPEG$)|(\.*.BMP$)/;
  //获取显示图片的画布
  let imgCanvas = document.getElementsByClassName("imgCanvas")[0];
  let context = imgCanvas.getContext('2d');
  let image = new Image();
  //判断画布上是否有图片
  let isDrawImg = false;
  //获取显示颜色的两个文本框
  let rgba = document.getElementsByClassName('rgb')[0];
  let sixteen = document.getElementsByClassName('sixteen')[0];
  //存入color
  let color;

  //定义上传图片文件的方法
  function uploadImage(imgFile) {
    //如果上传的不是图片，提示
    if (!suffix.test(imgFile.value)) {
      alert("只支持上传图片！")
    }
    //上传的是图片，则获取路径
    else {
      //如果已经显示图片了，则删除
      if (isDrawImg) {
        context.clearRect(0, 0, 800, 680);
      }
      //获取图片文件，读取DataURL
      let file = document.getElementById('inputImg').files;
      let reader = new FileReader();
      reader.readAsDataURL(file[0]);
      //获取数据
      reader.onload = function () {
        //显示图片
        imgOnload(reader.result);
      }
    }
  }

  //显示图片
  function imgOnload(result) {
    image.onload = function () {
      context.drawImage(this, 0, 0, 800, 680);
      isDrawImg = true;
    }
    image.src = result;
  }

  //点击显示颜色
  imgCanvas.addEventListener("click", (e) => {
    let x = e.layerX
    let y = e.layerY;
    let layer = context.getImageData(x, y, 1, 1).data;
    color = 'rgba(' + layer[0] + ',' + layer[1] + ',' + layer[2] + ',' + layer[3] / 255 + ')'
    document.body.style.backgroundColor = color;
    rgba.innerHTML = 'rgba(' + layer[0] + ',' + layer[1] + ',' + layer[2] + ',' + layer[3] / 255 + ')';
    colorRGBtoSix(color)
  })

  //将rgb值转换为十六进制
  function colorRGBtoSix(color) {
    let rgb = color.split(',');
    let r = parseInt(rgb[0].split('(')[1]);
    let g = parseInt(rgb[1]);
    let b = parseInt(rgb[2].split(')')[0]);
    sixteen.innerHTML = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }