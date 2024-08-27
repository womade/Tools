var run = false;
var timer;
var startButton;
var endButton;
var successdiv;
var errordiv;
var noSleep = new NoSleep();
var wakeLockEnabled = false;


$(document).ready(function () {
    startButton = $('#startButton');
    endButton = $('#endButton');
    successdiv = $('#successdiv');
    errordiv = $('#errordiv');
});

function refresh() {
    var reg=/^([hH][tT]{2}[pP]:\/\/|[hH][tT]{2}[pP][sS]:\/\/).+/;
    var url = $('#url').val();
    if(!reg.test(url)){
        endRefresh();
        showerror("🤔 请检查您输入的网址……");
        return false;
    }else{
        $('#successdiv').hide();
        $('#successdiv').text("");
        $('#errdiv').hide();
        $('#errdiv').text("");
    }
    if (run) {
        var frame = $('#frame');
        var frequency = getRefreshSpeed();
        frame.attr('src', url);
        var times = $('#times');
        times.val(parseInt(times.val()) + 1);
        updateRefreshSpeed();
        updateRefreshTasks();
        updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
        checktimes();
    }
}

function checktimes() {
    if (parseInt($('#task-count').val()) <= parseInt($('#times').val())) {
        endRefresh();
        showsuccess('😉 刷新任务已完成啦~');
        $('#remainingTime').text('00:00:00');
    }else{
        showsuccess('😉 交给我，玩儿去吧~');
  }
}

function getRefreshSpeed() {
  var radios = document.getElementsByName('refreshSpeed');
  for (var i = 0; i < radios.length; i++) {
    if (radios[i].checked) {
      return parseInt(radios[i].value);
    }
  }
  return 6;
}

function updateRefreshSpeed() {
    $('input[name="refreshSpeed"]').change(function() {
        if (run) {
            clearInterval(timer);
            var newFrequency = getRefreshSpeed();
            remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * getRefreshSpeed();
            updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
            timer = setInterval(refresh, newFrequency * 1000);
        }
    });
}

function updateRefreshTasks() {
    $('input[id="task-count"]').change(function() {
        if (run) {
            remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val())) * getRefreshSpeed();
            updateProgress(parseInt($('#times').val()), parseInt($('#task-count').val()));
        }
    });
}

function updateProgress(currentTimes, totalTasks) {
    var percentage = (currentTimes / totalTasks) * 100;
    var percentageRounded = parseFloat(percentage.toFixed(2));
    $('.progress-bar').css('width', percentageRounded + '%').text(percentageRounded + '%');
}

function updateDisplayTime(remainingSeconds) {
    let hours = Math.floor(remainingSeconds / 3600);
    let minutes = Math.floor((remainingSeconds % 3600) / 60);
    let seconds = remainingSeconds % 60;
    let formattedTime = hours.toString().padStart(2, '0') + ":" +
                        minutes.toString().padStart(2, '0') + ":" +
                        seconds.toString().padStart(2, '0');
    $('#remainingTime').text(formattedTime);
}

function startRefresh() {
    run = true;
    try {
        remainingSeconds = (parseInt($('#task-count').val()) - parseInt($('#times').val()) -1) * getRefreshSpeed();
        countdownTimer = setInterval(function() {
            if (remainingSeconds > 0) {
                remainingSeconds--;
                updateDisplayTime(remainingSeconds);
                } else {
                    clearInterval(countdownTimer);
                    //$('#remainingTime').text('00:00:00');
                }
        }, 1000);
        startButton.hide();
        endButton.show();
        successdiv.hide();
        errordiv.hide();
        noSleep.enable();
        var frequency = getRefreshSpeed();
        fetchUserId();
        refresh();
        timer = setInterval("refresh()", frequency * 1000);
    } catch (Exception) {
        startButton.show();
        endButton.hide();
        showerror('⚠ 参数出错，刷新重试');
    }
}

function endRefresh() {
    run = false;
    clearInterval(timer);
    clearInterval(countdownTimer);
    startButton.show();
    endButton.hide();
    successdiv.hide();
    errordiv.hide();
    noSleep.disable();
}

function cleanAll() {
    endRefresh();
    updateProgress(0, 100);
    document.getElementById('url').value = '';
    document.getElementById('task-count').value = '1024';
    document.getElementById('times').value = '0';
    useridButton.value = '用户编号';
    showsuccess('🆑 已成功清空配置啦~');
    var successDivElement = document.getElementById('successdiv');
    setTimeout(function() {
        successDivElement.style.display = 'none';
    }, 3000);
    $('#remainingTime').text('00:00:00');
}

function showsuccess(msg) {
    $('#successdiv').show();
    $('#successdiv').text(msg);
}

function showerror(msg) {
    $('#errordiv').show();
    $('#errordiv').text(msg);
}

async function fetchUserId() {
    const urlInput = document.getElementById('url');
    const useridButton = document.getElementById('useridButton');
    useridButton.value = '';
    useridButton.value = '获取中...';
    const userEnteredUrl = encodeURIComponent(urlInput.value.trim());
    const count = parseInt($('#task-count').val());
    const speed = getRefreshSpeed();
    const apiUrl = `https://api.ssss.fun/get/ccbft-userid.php?url=${userEnteredUrl}&count=${count}&speed=${speed}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const userId = data.userid;
        useridButton.value = userId ? userId : '未知用户';
    } catch (error) {
        console.error('获取用户编号时出错:', error);
        useridButton.value = '获取失败';
    }
}

document.getElementById('qrFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }  
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('qrCanvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
                document.getElementById('url').value = code.data;
                errordiv.hide();
                showsuccess('😉 解码成功，可开刷啦~');
            } else {
                document.getElementById('url').value = 'No QR code found or unable to decode.';
                successdiv.hide();
                showerror("☹️ 解码失败，检查一下？");
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});
