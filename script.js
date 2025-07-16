// ============================
// 🎯 Lucky Draw Main Script (With 中文注释)
// ============================

const canvas = document.getElementById("wheelcanvas");
const ctx = canvas.getContext("2d");

// 初始化数据：名单 & 中奖者
let names = JSON.parse(localStorage.getItem("names") || "[]");
let winners = JSON.parse(localStorage.getItem("winners") || "[]");

let currentAngle = 0;
let autoSpin = true;
let autoSpinId = null;
let spinSound = null;

// ============================
// 🚀 初始化页面
// ============================
(function initialize() {
  drawWheel();
  updateUserList();
  startAutoSpin();
  updateWinnerList();

  // ========== 🎯 标题初始化 ==========
  const titleEl = document.querySelector(".main-header h1");
  const savedTitle = localStorage.getItem("pageTitle");
  if (savedTitle) titleEl.textContent = savedTitle;

  // ========== 🎨 标题颜色初始化 ==========
  const colorPicker = document.getElementById("titleColorPicker");
  const savedColor = localStorage.getItem("titleColor");
  if (savedColor) {
    titleEl.style.color = savedColor;
    if (colorPicker) colorPicker.value = savedColor;
  }

  colorPicker?.addEventListener("input", () => {
    const newColor = colorPicker.value;
    titleEl.style.color = newColor;
    localStorage.setItem("titleColor", newColor);
  });

  // ========== 🎨 Winner List 字体颜色初始化 ==========
  const winnerList = document.getElementById("winner-list");
  const winnerColorPicker = document.getElementById("winnerFontColorPicker");
  const savedWinnerColor = localStorage.getItem("winnerFontColor");
  if (savedWinnerColor) {
    winnerList.style.color = savedWinnerColor;
    winnerList.querySelector("h3").style.color = savedWinnerColor;
    if (winnerColorPicker) winnerColorPicker.value = savedWinnerColor;
  }

  winnerColorPicker?.addEventListener("input", () => {
    const newColor = winnerColorPicker.value;
    winnerList.style.color = newColor;
    winnerList.querySelector("h3").style.color = newColor;
    localStorage.setItem("winnerFontColor", newColor);
  });

  // ========== 🎵 背景音乐初始化 ==========
  const bgMusic = document.getElementById("bgMusic");
  const savedVol = parseFloat(localStorage.getItem("bgVolume"));

  if (bgMusic) {
    // 设置背景音乐音量
    bgMusic.volume = isNaN(savedVol) ? 1 : savedVol;

    // 避免 reset 后自动播放，只有在音量 > 0 时播放
    if (bgMusic.volume > 0) {
      bgMusic.play().catch(err => {
        console.warn("🎵 背景音乐自动播放被浏览器阻止：", err);
      });
    }
  }
})();


// ============================
// 🎨 绘制转盘
// ============================
function drawWheel(angle = 0) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const count = names.length;
  if (count === 0) return;

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 10;
  const arcSize = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillStyle = `hsl(${(i * 360) / count}, 70%, 70%)`;
    ctx.arc(0, 0, radius, i * arcSize, (i + 1) * arcSize);
    ctx.lineTo(0, 0);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.textAlign = "right";
    ctx.font = `${radius * 0.07}px Arial`;
    ctx.save();
    ctx.rotate(i * arcSize + arcSize / 2);
    ctx.fillText(names[i], radius - 10, 10);
    ctx.restore();
    ctx.restore();
  }

  // 指针
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.88);
  ctx.lineTo(-20, -radius - 10);
  ctx.lineTo(20, -radius - 10);
  ctx.closePath();
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.restore();
}

// ============================
// 🎰 抽奖逻辑
// ============================
function spinWheel() {
  playClickSound();
  if (names.length === 0) return alert("No names to draw.");
  stopAutoSpin();
  playSpinSound();

  const count = names.length;
  const arcSize = (2 * Math.PI) / count;
  const spins = 5 + Math.random() * 2;
  const extraRotation = Math.random() * 2 * Math.PI;
  const finalAngle = currentAngle + spins * 2 * Math.PI + extraRotation;

  const duration = 4000;
  const initialAngle = currentAngle;
  let start = null;

  function animateSpin(timestamp) {
    if (!start) start = timestamp;
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const angle = initialAngle + (finalAngle - initialAngle) * ease;
    drawWheel(angle);

    if (progress < 1) {
      requestAnimationFrame(animateSpin);
    } else {
      currentAngle = angle % (2 * Math.PI);
      stopSpinSound();
      const pointerAngle = (1.5 * Math.PI - currentAngle + 2 * Math.PI) % (2 * Math.PI);
      const winnerIndex = Math.floor(pointerAngle / arcSize);
      const winnerName = names[winnerIndex];

      setTimeout(() => {
        showPopup(winnerName);
        names.splice(winnerIndex, 1);
        localStorage.setItem("names", JSON.stringify(names));
        winners.push(winnerName);
        localStorage.setItem("winners", JSON.stringify(winners));
        drawWheel();
        updateUserList();
        updateWinnerList();
		startAutoSpin(); // ✅ 恢复缓慢旋转
      }, 100);
    }
  }
  requestAnimationFrame(animateSpin);
}

// ============================
// 🎉 弹窗 & 彩带
// ============================
function showPopup(winnerName) {
  const popup = document.getElementById("customPopup");
  const nameDisplay = document.getElementById("winnerNameDisplay");
  nameDisplay.textContent = winnerName;
  popup.classList.add("show");
  popup.classList.remove("hidden");

  const enabled = localStorage.getItem("winSoundEnabled") !== "false";
  const volume = parseFloat(localStorage.getItem("winSoundVolume") || 0.5);
  if (enabled) {
    const winSound = new Audio("sound/win.mp3");
    winSound.volume = volume;
    winSound.play().catch(err => {
      console.warn("🏆 中奖音效播放失败：", err);
    });
  }

  launchConfetti();
}


function closePopup() {
  playClickSound();
  const popup = document.getElementById("customPopup");
  popup.classList.remove("show");
  setTimeout(() => popup.classList.add("hidden"), 300);
}

function launchConfetti() {
  const end = Date.now() + 2000;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

// ============================
// 🔊 音效控制
// ============================
function playClickSound() {
  const enabled = localStorage.getItem("clickSoundEnabled") !== "false";
  const volume = parseFloat(localStorage.getItem("clickSoundVolume") || 0.5);
  if (!enabled) return;

  const clickSound = new Audio("sound/click.mp3");
  clickSound.volume = volume;
  clickSound.play().catch(err => {
    console.warn("🔈 点击音效播放失败：", err);
  });
}


function playSpinSound() {
  const enabled = localStorage.getItem("spinSoundEnabled") !== "false";
  const volume = parseFloat(localStorage.getItem("spinSoundVolume") || 0.5);
  if (!enabled) return;

  spinSound = new Audio("sound/spin.mp3");
  spinSound.loop = true;
  spinSound.volume = volume;
  spinSound.play().catch(err => {
    console.warn("🎵 旋转音效播放失败：", err);
  });
}


function stopSpinSound() {
  if (spinSound) {
    spinSound.pause();
    spinSound.currentTime = 0;
    spinSound = null;
  }
}

function toggleMusic() {
  const audio = document.getElementById("bgMusic");
  const btn = document.querySelector(".music-toggle-btn");
  if (!audio) return;

  if (audio.paused) {
    audio.play()
      .then(() => {
        if (btn) btn.textContent = "🔇";
      })
      .catch(err => {
        console.warn("🎵 背景音乐播放被阻止：", err);
        if (btn) btn.textContent = "🔊"; // fallback
      });
  } else {
    audio.pause();
    if (btn) btn.textContent = "🔊";
  }
}


function startAutoSpin() {
  autoSpin = true;
  function spin() {
    if (!autoSpin) return;
    currentAngle += 0.01;
    drawWheel(currentAngle);
    autoSpinId = requestAnimationFrame(spin);
  }
  spin();
}

function stopAutoSpin() {
  autoSpin = false;
  cancelAnimationFrame(autoSpinId);
}

function updateUserList() {
  const userlist = document.getElementById("userlist");
  if (!userlist) return;

  let html = names.length === 0 ? "<em class='no-users'>No users</em>" : "<b>User List:</b><ul>";
  names.forEach((name, i) => {
    html += `<li><span>${name}</span><button onclick="removeUser(${i})">Remove</button></li>`;
  });
  html += names.length > 0 ? "</ul><button onclick='removeAllUsers()' style='margin-top:16px;background:#dc3545;'>Remove All</button>" : "";
  userlist.innerHTML = html;
}

function updateWinnerList() {
  const container = document.querySelector("#winner-list ul");
  if (!container) return;
  container.innerHTML = "";
  winners = JSON.parse(localStorage.getItem("winners") || "[]");
  winners.forEach((name, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${name}`;
    container.appendChild(li);
  });
}

function removeUser(index) {
  names.splice(index, 1);
  localStorage.setItem("names", JSON.stringify(names));
  drawWheel();
  updateUserList();
}

function removeAllUsers() {
  if (confirm("Are you sure you want to remove all names?")) {
    names = [];
    localStorage.setItem("names", JSON.stringify(names));
    drawWheel();
    updateUserList();
  }
}

function exportNames() {
  const blob = new Blob([names.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "names.txt";
  a.click();
  URL.revokeObjectURL(url);
}

function insertName() {
  const input = document.getElementById("username");
  const name = input.value.trim();
  if (!name) return;
  if (names.includes(name)) {
    alert(`"${name}" is already added!`);
    input.value = "";
    return;
  }
  names.push(name);
  localStorage.setItem("names", JSON.stringify(names));
  input.value = "";
  drawWheel();
  updateUserList();
}

function uploadBackground(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.body.style.backgroundImage = `url('${e.target.result}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundAttachment = "fixed";
  };
  reader.readAsDataURL(file);
}

function clearWinners() {
  if (confirm("Are you sure you want to clear the winner list?")) {
    winners = [];
    localStorage.setItem("winners", JSON.stringify(winners));
    updateWinnerList();
  }
}

function requestUserList() {
  sendMessage("getUserList");
}

window.addEventListener("message", (event) => {
  const { type, payload } = event.data;
  if (type === "userList" && Array.isArray(payload)) {
    const listEl = document.getElementById("userListDisplay");
    listEl.innerHTML = "";
    if (payload.length === 0) {
      listEl.innerHTML = "<li><em>暂无用户</em></li>";
    } else {
      payload.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        listEl.appendChild(li);
      });
    }
  }
});


// ============================
// 📩 接收 admin.html 发来的控制消息（增强版）
// ============================
window.addEventListener("message", (event) => {
  const { type, payload } = event.data;
  switch (type) {
	case "insertName":
	  if (!names.includes(payload)) {
		names.push(payload);
		localStorage.setItem("names", JSON.stringify(names));
		drawWheel();
		updateUserList();
	  } else {
		// 发送重复提示回 admin.html
		event.source.postMessage({ type: "nameDuplicate", payload }, "*");
	  }
	  break;

    case "removeAllNames":
      names = [];
      localStorage.setItem("names", JSON.stringify(names));
      drawWheel();
      updateUserList();
      break;

    case "setTitle":
      const titleEl = document.querySelector(".main-header h1");
      if (titleEl && payload.trim()) {
        titleEl.textContent = payload;
        localStorage.setItem("pageTitle", payload);
      }
      break;

    case "setVolume":
      const bgMusic = document.getElementById("bgMusic");
      if (bgMusic) {
        bgMusic.volume = payload;
        localStorage.setItem("bgVolume", payload);
      }
      break;

    case "setTitleColor":
      document.querySelector(".main-header h1").style.color = payload;
      localStorage.setItem("titleColor", payload);
      break;

    case "setWinnerColor":
      const winnerList = document.getElementById("winner-list");
      winnerList.style.color = payload;
      winnerList.querySelector("h3").style.color = payload;
      localStorage.setItem("winnerFontColor", payload);
      break;

    case "setBackground":
      document.body.style.backgroundImage = `url(${payload})`;
      document.body.style.backgroundSize = "cover";
      document.body.style.backgroundRepeat = "no-repeat";
      document.body.style.backgroundPosition = "center";
      document.body.style.backgroundAttachment = "fixed";
      localStorage.setItem("bgImage", payload);
      break;

    case "uploadNameList":
      if (Array.isArray(payload)) {
        for (const name of payload) {
          if (!names.includes(name)) names.push(name);
        }
        localStorage.setItem("names", JSON.stringify(names));
        drawWheel();
        updateUserList();
      }
      break;

    case "requestNameExport":
      exportNames();
      break;

    case "clearWinners":
      winners = [];
      localStorage.setItem("winners", JSON.stringify(winners));
      updateWinnerList();
      break;

    case "spinNow":
      spinWheel();
      break;

    case "toggleMusic":
      toggleMusic();
      break;

    case "startAutoSpin":
      startAutoSpin();
      break;

    case "stopAutoSpin":
      stopAutoSpin();
      break;
	
	 // 🔊 新增音效设置同步：
	case "updateSoundSettings":
	  // ✅ 保存设置到 localStorage
	  localStorage.setItem("clickSoundEnabled", payload.clickEnabled);
	  localStorage.setItem("spinSoundEnabled", payload.spinEnabled);
	  localStorage.setItem("winSoundEnabled", payload.winEnabled);
	  localStorage.setItem("clickSoundVolume", payload.clickVol);
	  localStorage.setItem("spinSoundVolume", payload.spinVol);
	  localStorage.setItem("winSoundVolume", payload.winVol);

	  // ✅ 实时应用背景音乐音量
	  const bgVol = parseFloat(localStorage.getItem("bgVolume") || "1");
	  const bgMusic = document.getElementById("bgMusic");
	  if (bgMusic && !isNaN(bgVol)) {
		bgMusic.volume = bgVol;
	  }

	  console.log("🔊 音效设置已更新并应用");
	  break;


  }
});
