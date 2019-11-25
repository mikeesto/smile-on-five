const videoElement = document.querySelector("#video");
const timeElement = document.querySelector(".time");

const cameraBtn = document.querySelector(".cameraBtn");
cameraBtn.addEventListener("click", camera);

const loadBtn = document.querySelector(".loadBtn");
loadBtn.addEventListener("click", load);

const goBtn = document.querySelector(".goBtn");
goBtn.addEventListener("click", go);

let timer;

if (/Mobi|Android|iPhone|iPod|iPad/i.test(navigator.userAgent)) {
  document.querySelector(".warning").textContent =
    "Hi! Thanks for checking out this app. Unfortunately it doesn't perform well on mobile. You can give it a go, but you might have a better experience on a desktop";
}

function camera() {
  navigator.mediaDevices
    .getUserMedia({
      video
    })
    .then(stream => {
      videoElement.srcObject = stream;
      cameraBtn.style.display = "none";
      loadBtn.disabled = false;
    })
    .catch(error => {
      console.log(error);
      window.alert("This app needs to access your webcam to work, sorry!");
    });
}

function load() {
  loadBtn.disabled = true;
  Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceExpressionNet.loadFromUri("/models")
  ])
    .then(async () => {
      // Run the recognition once to preload the shaders
      await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceExpressions();
      loadBtn.style.display = "none";
      goBtn.disabled = false;
    })
    .catch(error => console.log(error));
}

function go() {
  // Make sure the video is streaming & stopwatch colour is reset
  if (videoElement.paused) {
    videoElement.play();
    timeElement.style.color = "black";
  }

  goBtn.disabled = true;
  stopwatch();

  const recognition = setInterval(async () => {
    const result = await faceapi
      .detectSingleFace(videoElement)
      .withFaceLandmarks()
      .withFaceExpressions();

    if (result.expressions) {
      const happyExpression = result.expressions.happy * 100;
      if (happyExpression > 85) {
        clearInterval(timer);
        videoElement.pause();
        goBtn.disabled = false;

        // Check if near the 5 second mark
        const seconds = timeElement.textContent.split(":")[1];
        if (seconds == "05") {
          timeElement.style.color = "green";
        } else {
          timeElement.style.color = "#f03d34";
        }

        clearInterval(recognition);
      }
    }
  }, 400);
}

function stopwatch() {
  const startTime = new moment();

  timer = setInterval(() => {
    const currentTime = new moment();
    const duration = currentTime.diff(startTime);
    let formattedTime = moment.utc(duration).format("mm:ss:SSS");
    timeElement.innerHTML = formattedTime;
  }, 1);
}
