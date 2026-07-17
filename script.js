/*
 * HandCare Dashboard
 * ------------------------------------------------------------
 * Đây là phiên bản frontend chạy độc lập bằng dữ liệu mô phỏng.
 *
 * Cách 1 - Backend riêng (điều khiển 2 chiều):
 * 1. Đặt CONFIG.useMockData = false.
 * 2. Sửa CONFIG.apiBaseUrl thành địa chỉ server của bạn.
 * 3. Backend cần cung cấp các API:
 *    GET  /api/device/status
 *    POST /api/device/control      body: { "power": true | false }
 *    GET  /api/dashboard?range=week|month|year
 *
 * Cách 2 - Đọc trực tiếp từ ThingSpeak (chỉ giám sát, không điều khiển):
 * 1. Đặt CONFIG.useThingSpeak = true.
 * 2. Điền CONFIG.thingSpeakChannelId (và thingSpeakReadApiKey nếu channel Private).
 * 3. ESP32 (xem firmware/hand_rehab_esp32.ino) sẽ ghi dữ liệu lên ThingSpeak,
 *    website sẽ định kỳ đọc lại và hiển thị trạng thái/góc gập thời gian thực.
 *
 * Không nên điều khiển ESP32 trực tiếp từ trình duyệt qua Internet.
 * Nên đặt một backend trung gian có xác thực, phân quyền và ghi log.
 */

"use strict";

const CONFIG = {
  useMockData: true,
  apiBaseUrl: "http://192.168.1.100:8080",
  requestTimeoutMs: 6000,
  demoAccount: { username: "benhnhan", password: "123456" },

  // ---- Đọc dữ liệu thời gian thực từ ThingSpeak ----
  useThingSpeak: true,
  thingSpeakChannelId: "3424945",
  thingSpeakReadApiKey: "53YHGO8I3D4IVQ00", // để trống nếu channel ThingSpeak là Public
  thingSpeakPollMs: 16000,  // ThingSpeak free tối thiểu 15s/lần, nên để >= 15000
};

const dashboardData = {
  week: {
    totalTrainingTime: 145,
    totalTrainingUnit: "phút",
    change: 12,
    averageSessionTime: 24,
    completedSessions: 6,
    plannedSessions: 7,
    supportForceLabel: "Trung bình",
    supportForcePercent: 35,
    currentFlexion: 78,
    flexionImprovement: 13,
    flexionTarget: 90,
    progressScore: 82,
    labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    flexionValues: [65, 67, 69, 71, 73, 76, 78],
    sessionDurations: [20, 22, 25, 23, 28, 27, 0],
    chartDescription: "Theo dõi góc gập lớn nhất trong 7 ngày gần đây",
    analysis: {
      duration: "Bạn đã đạt trung bình 24 phút mỗi buổi.",
      flexion: "Tăng 13° trong 7 ngày gần nhất.",
      force: "Giữ mức hỗ trợ 35% trong 3 buổi tiếp theo, chưa nên giảm ngay.",
      score:
        "Tiến độ tốt. Góc gập và thời lượng tập đều tăng so với giai đoạn trước.",
      status: "Đang tiến bộ",
    },
  },
  month: {
    totalTrainingTime: 590,
    totalTrainingUnit: "phút",
    change: 9,
    averageSessionTime: 23,
    completedSessions: 25,
    plannedSessions: 28,
    supportForceLabel: "Trung bình",
    supportForcePercent: 32,
    currentFlexion: 82,
    flexionImprovement: 22,
    flexionTarget: 90,
    progressScore: 86,
    labels: ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"],
    flexionValues: [60, 68, 75, 82],
    sessionDurations: [132, 148, 151, 159],
    chartDescription: "Góc gập trung bình theo từng tuần trong tháng",
    analysis: {
      duration: "Tổng thời gian tập trong tháng đạt 590 phút.",
      flexion: "Tăng 22° so với đầu tháng.",
      force: "Có thể thử giảm hỗ trợ từ 32% xuống 30% khi có chuyên viên giám sát.",
      score:
        "Khả năng vận động cải thiện rõ. Mức độ duy trì bài tập đang ổn định.",
      status: "Tiến bộ tốt",
    },
  },
  year: {
    totalTrainingTime: 6840,
    totalTrainingUnit: "phút",
    change: 18,
    averageSessionTime: 22,
    completedSessions: 311,
    plannedSessions: 336,
    supportForceLabel: "Thấp",
    supportForcePercent: 18,
    currentFlexion: 92,
    flexionImprovement: 47,
    flexionTarget: 95,
    progressScore: 93,
    labels: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
    flexionValues: [45, 50, 56, 61, 66, 70, 74, 78, 82, 86, 89, 92],
    sessionDurations: [420, 465, 510, 530, 550, 570, 575, 585, 600, 640, 690, 705],
    chartDescription: "Góc gập trung bình theo từng tháng trong năm",
    analysis: {
      duration: "Bạn đã duy trì tập luyện tương đối đều trong 12 tháng.",
      flexion: "Tăng 47° so với đầu năm.",
      force: "Mức hỗ trợ đã giảm còn 18%; cần đánh giá trước khi chuyển sang tập chủ động hoàn toàn.",
      score:
        "Tiến độ rất tốt, nhưng cần tiếp tục chú ý chất lượng vận động, không chỉ góc gập.",
      status: "Rất tốt",
    },
  },
};

const trainingHistory = [
  {
    date: "09/07/2026, 08:15",
    duration: 27,
    flexion: 78,
    force: 35,
    result: "Hoàn thành",
  },
  {
    date: "08/07/2026, 08:20",
    duration: 28,
    flexion: 76,
    force: 35,
    result: "Hoàn thành",
  },
  {
    date: "07/07/2026, 17:10",
    duration: 23,
    flexion: 73,
    force: 38,
    result: "Hoàn thành",
  },
  {
    date: "06/07/2026, 08:30",
    duration: 25,
    flexion: 71,
    force: 38,
    result: "Hoàn thành",
  },
  {
    date: "05/07/2026, 08:25",
    duration: 22,
    flexion: 69,
    force: 40,
    result: "Hoàn thành",
  },
];

const state = {
  selectedRange: "week",
  devicePower: true,
  deviceConnected: true,
  chartPoints: [],
  chartDimensions: null,
  liveFlexion: null,
  liveState: null,
  liveSessionSeconds: null,
  liveCycleCount: null,
  liveSupportPercent: null,
};

const elements = {};

document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
  cacheElements();
  bindEvents();
  restoreRememberedAccount();
  restoreLoginSession();
  renderTrainingHistory();
  updateLastSyncTime();
  renderRange("week");
  syncDeviceStatus();
  window.addEventListener("resize", debounce(drawChart, 120));
}

function cacheElements() {
  const ids = [
    "lastSyncTime",
    "deviceConnectionBadge",
    "deviceModeText",
    "devicePowerLabel",
    "deviceToggle",
    "totalTrainingTime",
    "trainingTimeChange",
    "averageSessionTime",
    "averageSessionHint",
    "completedSessions",
    "completionRate",
    "supportForce",
    "supportForceValue",
    "chartSubtitle",
    "currentFlexion",
    "flexionImprovement",
    "flexionTarget",
    "flexionChart",
    "chartTooltip",
    "progressBadge",
    "progressScore",
    "progressBar",
    "scoreDescription",
    "durationAnalysis",
    "flexionAnalysis",
    "forceRecommendation",
    "trainingHistoryBody",
    "openGuideButton",
    "guideDialog",
    "viewAllHistoryButton",
    "toastRegion",
    "loginScreen",
    "appShell",
    "loginForm",
    "username",
    "password",
    "usernameError",
    "passwordError",
    "rememberAccount",
    "loginButton",
    "loginMessage",
    "togglePasswordButton",
    "logoutButton",
    "dailyGoalRing",
    "dailyGoalPercent",
    "dailyGoalText",
    "liveFlexionText",
    "liveSessionText",
    "liveCycleText",
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });

  elements.rangeButtons = [...document.querySelectorAll(".range-button")];
}

function bindEvents() {
  elements.rangeButtons.forEach((button) => {
    button.addEventListener("click", () => renderRange(button.dataset.range));
  });

  elements.loginForm.addEventListener("submit", handleLogin);
  elements.togglePasswordButton.addEventListener("click", togglePasswordVisibility);
  elements.logoutButton.addEventListener("click", handleLogout);

  elements.deviceToggle.addEventListener("click", handleDeviceToggle);
  elements.openGuideButton.addEventListener("click", openGuideDialog);

  if (CONFIG.useThingSpeak) {
    elements.deviceToggle.disabled = true;
    elements.deviceToggle.style.opacity = "0.6";
    elements.deviceToggle.title =
      "Chế độ chỉ giám sát: bật/tắt máy trực tiếp trên thiết bị, website chỉ hiển thị dữ liệu.";
  }
  elements.viewAllHistoryButton.addEventListener("click", () => {
    showToast(
      "Nhật ký đầy đủ",
      "Phiên bản demo đang hiển thị 5 buổi gần nhất. Khi nối backend, nút này có thể mở trang lịch sử chi tiết.",
      "success"
    );
  });

  elements.flexionChart.addEventListener("mousemove", handleChartPointerMove);
  elements.flexionChart.addEventListener("mouseleave", hideChartTooltip);
  elements.flexionChart.addEventListener("touchstart", handleChartTouch, {
    passive: true,
  });
}


function restoreRememberedAccount() {
  const rememberedUsername = localStorage.getItem("handcareRememberedUsername");
  if (rememberedUsername) {
    elements.username.value = rememberedUsername;
    elements.rememberAccount.checked = true;
  }
}

function restoreLoginSession() {
  if (sessionStorage.getItem("handcareLoggedIn") === "true") showDashboard();
  else showLoginScreen();
}

async function handleLogin(event) {
  event.preventDefault();
  clearLoginErrors();

  const username = elements.username.value.trim();
  const password = elements.password.value;
  let hasError = false;

  if (!username) {
    setFieldError(elements.username, elements.usernameError, "Vui lòng nhập tên tài khoản.");
    hasError = true;
  }
  if (!password) {
    setFieldError(elements.password, elements.passwordError, "Vui lòng nhập mật khẩu.");
    hasError = true;
  }
  if (hasError) return;

  elements.loginButton.disabled = true;
  elements.loginButton.textContent = "Đang đăng nhập...";
  elements.loginMessage.textContent = "";

  try {
    let loginSucceeded = false;
    if (CONFIG.useMockData) {
      await delay(350);
      loginSucceeded = username === CONFIG.demoAccount.username && password === CONFIG.demoAccount.password;
    } else {
      const result = await fetchJson("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      loginSucceeded = Boolean(result.authenticated);
    }

    if (!loginSucceeded) {
      elements.loginMessage.textContent = "Tên tài khoản hoặc mật khẩu không đúng.";
      return;
    }

    sessionStorage.setItem("handcareLoggedIn", "true");
    if (elements.rememberAccount.checked) localStorage.setItem("handcareRememberedUsername", username);
    else localStorage.removeItem("handcareRememberedUsername");

    elements.password.value = "";
    showDashboard();
    showToast("Đăng nhập thành công", "Bạn đã vào hệ thống giám sát HandCare.", "success");
  } catch (error) {
    console.error(error);
    elements.loginMessage.textContent = "Không thể kết nối máy chủ đăng nhập. Vui lòng thử lại.";
  } finally {
    elements.loginButton.disabled = false;
    elements.loginButton.textContent = "Đăng nhập";
  }
}

function handleLogout() {
  sessionStorage.removeItem("handcareLoggedIn");
  elements.password.value = "";
  showLoginScreen();
}

function showDashboard() {
  elements.loginScreen.hidden = true;
  elements.appShell.hidden = false;
  requestAnimationFrame(drawChart);
}

function showLoginScreen() {
  elements.appShell.hidden = true;
  elements.loginScreen.hidden = false;
  window.setTimeout(() => elements.username.focus(), 0);
}

function togglePasswordVisibility() {
  const isHidden = elements.password.type === "password";
  elements.password.type = isHidden ? "text" : "password";
  elements.togglePasswordButton.textContent = isHidden ? "Ẩn" : "Hiện";
  elements.togglePasswordButton.setAttribute("aria-label", isHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu");
}

function clearLoginErrors() {
  [[elements.username, elements.usernameError], [elements.password, elements.passwordError]].forEach(([input, errorElement]) => {
    input.classList.remove("is-invalid");
    errorElement.textContent = "";
  });
  elements.loginMessage.textContent = "";
}

function setFieldError(input, errorElement, message) {
  input.classList.add("is-invalid");
  errorElement.textContent = message;
}

async function renderRange(range) {
  if (!dashboardData[range]) {
    return;
  }

  state.selectedRange = range;

  elements.rangeButtons.forEach((button) => {
    const isActive = button.dataset.range === range;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  let data;

  try {
    data = CONFIG.useMockData
      ? dashboardData[range]
      : await fetchJson(`/api/dashboard?range=${encodeURIComponent(range)}`);

    updateDashboard(data);
    updateLastSyncTime();
  } catch (error) {
    console.error(error);
    showToast(
      "Không tải được dữ liệu",
      "Hệ thống đang dùng dữ liệu gần nhất đã lưu trên trình duyệt.",
      "error"
    );
    updateDashboard(dashboardData[range]);
  }
}

function updateDashboard(data) {
  const completionPercent = Math.round(
    (data.completedSessions / data.plannedSessions) * 100
  );

  elements.totalTrainingTime.textContent =
    `${formatNumber(data.totalTrainingTime)} ${data.totalTrainingUnit}`;

  elements.trainingTimeChange.textContent =
    `${data.change >= 0 ? "↑" : "↓"} ${Math.abs(data.change)}% so với giai đoạn trước`;

  elements.trainingTimeChange.classList.toggle("trend--up", data.change >= 0);
  elements.trainingTimeChange.classList.toggle("trend--down", data.change < 0);

  elements.averageSessionTime.textContent = `${data.averageSessionTime} phút`;
  elements.completedSessions.textContent =
    `${data.completedSessions} / ${data.plannedSessions} buổi`;
  elements.completionRate.textContent = `Tỷ lệ hoàn thành ${completionPercent}%`;

  elements.supportForce.textContent = data.supportForceLabel;
  elements.supportForceValue.textContent =
    `Cài đặt hiện tại: ${data.supportForcePercent}%`;

  elements.chartSubtitle.textContent = data.chartDescription;
  elements.currentFlexion.textContent = `${data.currentFlexion}°`;
  elements.flexionImprovement.textContent =
    `${data.flexionImprovement >= 0 ? "+" : ""}${data.flexionImprovement}°`;
  elements.flexionTarget.textContent = `${data.flexionTarget}°`;

  elements.progressScore.textContent = data.progressScore;
  elements.progressBar.style.width = `${clamp(data.progressScore, 0, 100)}%`;
  elements.progressBar.parentElement.setAttribute(
    "aria-label",
    `Điểm tiến độ ${data.progressScore} trên 100`
  );

  elements.progressBadge.textContent = data.analysis.status;
  elements.scoreDescription.textContent = data.analysis.score;
  elements.durationAnalysis.textContent = data.analysis.duration;
  elements.flexionAnalysis.textContent = data.analysis.flexion;
  elements.forceRecommendation.textContent = data.analysis.force;

  requestAnimationFrame(drawChart);
}

function drawChart() {
  const canvas = elements.flexionChart;
  const data = dashboardData[state.selectedRange];
  const containerRect = canvas.parentElement.getBoundingClientRect();

  const width = Math.max(320, Math.floor(containerRect.width));
  const height = window.innerWidth <= 560 ? 280 : 330;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const padding = {
    top: 24,
    right: 24,
    bottom: 44,
    left: 48,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    data.flexionTarget + 10,
    ...data.flexionValues.map((value) => value + 10)
  );
  const minValue = Math.max(
    0,
    Math.min(...data.flexionValues.map((value) => value - 10))
  );

  drawGridAndAxes(ctx, width, height, padding, minValue, maxValue);
  drawTargetLine(
    ctx,
    data.flexionTarget,
    padding,
    plotWidth,
    plotHeight,
    minValue,
    maxValue
  );

  const points = data.flexionValues.map((value, index) => {
    const denominator = Math.max(1, data.flexionValues.length - 1);
    const x = padding.left + (index / denominator) * plotWidth;
    const y =
      padding.top +
      ((maxValue - value) / (maxValue - minValue)) * plotHeight;

    return {
      x,
      y,
      value,
      label: data.labels[index],
    };
  });

  drawArea(ctx, points, height - padding.bottom);
  drawLine(ctx, points);
  drawPoints(ctx, points);
  drawXAxisLabels(ctx, points, height);

  state.chartPoints = points;
  state.chartDimensions = { width, height, padding };
}

function drawGridAndAxes(ctx, width, height, padding, minValue, maxValue) {
  const plotHeight = height - padding.top - padding.bottom;
  const gridCount = 5;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let i = 0; i <= gridCount; i += 1) {
    const y = padding.top + (i / gridCount) * plotHeight;
    const value = Math.round(maxValue - (i / gridCount) * (maxValue - minValue));

    ctx.strokeStyle = "#e8edf5";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillStyle = "#7a8598";
    ctx.fillText(`${value}°`, padding.left - 10, y);
  }

  ctx.restore();
}

function drawTargetLine(
  ctx,
  target,
  padding,
  plotWidth,
  plotHeight,
  minValue,
  maxValue
) {
  const y =
    padding.top +
    ((maxValue - target) / (maxValue - minValue)) * plotHeight;

  ctx.save();
  ctx.strokeStyle = "#b26b00";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(padding.left, y);
  ctx.lineTo(padding.left + plotWidth, y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#b26b00";
  ctx.font = "700 11px Inter, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Mục tiêu ${target}°`, padding.left + plotWidth, y - 8);
  ctx.restore();
}

function drawArea(ctx, points, baselineY) {
  if (!points.length) return;

  const gradient = ctx.createLinearGradient(0, points[0].y, 0, baselineY);
  gradient.addColorStop(0, "rgba(34, 104, 232, 0.24)");
  gradient.addColorStop(1, "rgba(34, 104, 232, 0.02)");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0].x, baselineY);
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.lineTo(point.x, point.y);
    } else {
      const previous = points[index - 1];
      const midpointX = (previous.x + point.x) / 2;
      ctx.bezierCurveTo(
        midpointX,
        previous.y,
        midpointX,
        point.y,
        point.x,
        point.y
      );
    }
  });
  ctx.lineTo(points[points.length - 1].x, baselineY);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

function drawLine(ctx, points) {
  if (!points.length) return;

  ctx.save();
  ctx.strokeStyle = "#2268e8";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();

  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      const previous = points[index - 1];
      const midpointX = (previous.x + point.x) / 2;
      ctx.bezierCurveTo(
        midpointX,
        previous.y,
        midpointX,
        point.y,
        point.x,
        point.y
      );
    }
  });

  ctx.stroke();
  ctx.restore();
}

function drawPoints(ctx, points) {
  ctx.save();

  points.forEach((point) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#2268e8";
    ctx.stroke();
  });

  ctx.restore();
}

function drawXAxisLabels(ctx, points, chartHeight) {
  ctx.save();
  ctx.fillStyle = "#7a8598";
  ctx.font = "12px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const maxLabels = window.innerWidth < 560 ? 6 : 12;
  const step = Math.max(1, Math.ceil(points.length / maxLabels));

  points.forEach((point, index) => {
    const shouldDraw =
      index % step === 0 || index === points.length - 1;

    if (shouldDraw) {
      ctx.fillText(point.label, point.x, chartHeight - 30);
    }
  });

  ctx.restore();
}

function handleChartPointerMove(event) {
  const rect = elements.flexionChart.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  showNearestChartPoint(mouseX, mouseY);
}

function handleChartTouch(event) {
  const touch = event.touches[0];
  if (!touch) return;

  const rect = elements.flexionChart.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  showNearestChartPoint(x, y);
}

function showNearestChartPoint(x, y) {
  if (!state.chartPoints.length) return;

  let nearestPoint = state.chartPoints[0];
  let nearestDistance = Number.POSITIVE_INFINITY;

  state.chartPoints.forEach((point) => {
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPoint = point;
    }
  });

  if (nearestDistance > 42) {
    hideChartTooltip();
    return;
  }

  elements.chartTooltip.hidden = false;
  elements.chartTooltip.innerHTML =
    `<strong>${escapeHtml(nearestPoint.label)}</strong><br>` +
    `Góc gập: ${nearestPoint.value}°`;
  elements.chartTooltip.style.left = `${nearestPoint.x}px`;
  elements.chartTooltip.style.top = `${nearestPoint.y}px`;
}

function hideChartTooltip() {
  elements.chartTooltip.hidden = true;
}

function renderTrainingHistory() {
  elements.trainingHistoryBody.innerHTML = trainingHistory
    .map(
      (item) => `
        <tr>
          <td><strong>${escapeHtml(item.date)}</strong></td>
          <td>${item.duration} phút</td>
          <td>${item.flexion}°</td>
          <td>${item.force}%</td>
          <td><span class="status-pill">${escapeHtml(item.result)}</span></td>
        </tr>
      `
    )
    .join("");
}

async function handleDeviceToggle() {
  if (!state.deviceConnected) {
    showToast(
      "Thiết bị chưa kết nối",
      "Kiểm tra nguồn, Wi-Fi và địa chỉ máy chủ trước khi điều khiển.",
      "error"
    );
    return;
  }

  const nextPowerState = !state.devicePower;
  setDeviceToggleLoading(true);

  try {
    if (!CONFIG.useMockData) {
      await fetchJson("/api/device/control", {
        method: "POST",
        body: JSON.stringify({ power: nextPowerState }),
      });
    } else {
      await delay(450);
    }

    state.devicePower = nextPowerState;
    updateDeviceUi();

    showToast(
      nextPowerState ? "Đã bật máy" : "Đã tắt máy",
      nextPowerState
        ? "Thiết bị đã sẵn sàng cho buổi tập."
        : "Thiết bị đã dừng. Dữ liệu theo dõi vẫn được lưu.",
      "success"
    );
  } catch (error) {
    console.error(error);
    showToast(
      "Không thể điều khiển máy",
      "Không nhận được phản hồi từ ESP32 hoặc máy chủ trung gian.",
      "error"
    );
  } finally {
    setDeviceToggleLoading(false);
  }
}

async function syncDeviceStatus() {
  if (CONFIG.useThingSpeak) {
    await refreshLiveDeviceData();
    window.setInterval(refreshLiveDeviceData, CONFIG.thingSpeakPollMs);
    return;
  }

  if (CONFIG.useMockData) {
    updateDeviceUi();
    return;
  }

  try {
    const status = await fetchJson("/api/device/status");
    state.devicePower = Boolean(status.power);
    state.deviceConnected = Boolean(status.connected);
    updateDeviceUi();
  } catch (error) {
    console.error(error);
    state.deviceConnected = false;
    updateDeviceUi();
  }
}

// ---------------------------------------------------------------
// Tích hợp ThingSpeak: đọc bản ghi mới nhất do ESP32 gửi lên và
// hiển thị lên khu vực "Thiết bị tập luyện" của dashboard.
// Field1: góc gập (độ) | Field2: trạng thái (0/1/2)
// Field3: bật/tắt (1/0) | Field4: thời gian phiên (giây)
// Field5: số chu kỳ    | Field6: mức hỗ trợ (%)
// ---------------------------------------------------------------
const STATE_LABELS = ["Co tay", "Giu tay", "Thu hoi"];

async function fetchThingSpeakLatest() {
  const params = new URLSearchParams({ results: "1" });
  if (CONFIG.thingSpeakReadApiKey) {
    params.set("api_key", CONFIG.thingSpeakReadApiKey);
  }

  const url = `https://api.thingspeak.com/channels/${encodeURIComponent(
    CONFIG.thingSpeakChannelId
  )}/feeds.json?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    const feed = data.feeds && data.feeds[0];
    if (!feed) throw new Error("Channel ThingSpeak chưa có dữ liệu nào.");
    return feed;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function refreshLiveDeviceData() {
  try {
    const feed = await fetchThingSpeakLatest();
    const feedAgeMs = Date.now() - new Date(feed.created_at).getTime();

    state.devicePower = feed.field3 === "1";
    // Nếu quá lâu không có bản ghi mới, coi như thiết bị mất kết nối.
    state.deviceConnected = Number.isFinite(feedAgeMs) && feedAgeMs < 60000;

    state.liveFlexion = feed.field1 !== null ? Number(feed.field1) : null;
    state.liveState = feed.field2 !== null ? Number(feed.field2) : null;
    state.liveSessionSeconds = feed.field4 !== null ? Number(feed.field4) : null;
    state.liveCycleCount = feed.field5 !== null ? Number(feed.field5) : null;
    state.liveSupportPercent = feed.field6 !== null ? Number(feed.field6) : null;

    updateDeviceUi();
    updateLastSyncTime();
  } catch (error) {
    console.error(error);
    state.deviceConnected = false;
    updateDeviceUi();
    showToast(
      "Không lấy được dữ liệu ThingSpeak",
      "Kiểm tra Channel ID, Read API Key hoặc kết nối Internet.",
      "error"
    );
  }
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function updateDeviceUi() {
  const { devicePower, deviceConnected } = state;

  elements.deviceToggle.classList.toggle("is-on", devicePower);
  elements.deviceToggle.setAttribute("aria-checked", String(devicePower));
  elements.deviceToggle.querySelector(".power-switch__text").textContent =
    devicePower ? "BẬT" : "TẮT";

  elements.devicePowerLabel.textContent = devicePower ? "Đang bật" : "Đã tắt";

  if (CONFIG.useThingSpeak && devicePower && state.liveState !== null && state.liveState !== undefined) {
    const label = STATE_LABELS[state.liveState] || "--";
    elements.deviceModeText.textContent = `Trạng thái: ${label}`;
  } else {
    elements.deviceModeText.textContent = devicePower
      ? "Chế độ: Hỗ trợ tự động"
      : "Máy đang ở trạng thái nghỉ";
  }

  elements.deviceConnectionBadge.textContent = deviceConnected
    ? "Đã kết nối"
    : "Mất kết nối";
  elements.deviceConnectionBadge.classList.toggle(
    "badge--success",
    deviceConnected
  );
  elements.deviceConnectionBadge.classList.toggle(
    "badge--danger",
    !deviceConnected
  );

  if (CONFIG.useThingSpeak) {
    const hasLiveData = deviceConnected && state.liveFlexion !== null;

    elements.liveFlexionText.hidden = !hasLiveData;
    elements.liveSessionText.hidden = !hasLiveData;
    elements.liveCycleText.hidden = !hasLiveData;

    if (hasLiveData) {
      elements.liveFlexionText.textContent = `Góc gập hiện tại: ${Math.round(state.liveFlexion)}°`;
      elements.liveSessionText.textContent = `Thời gian phiên: ${formatDuration(state.liveSessionSeconds)}`;
      elements.liveCycleText.textContent = `Chu kỳ: ${state.liveCycleCount ?? "--"}`;
    }
  }
}

function setDeviceToggleLoading(isLoading) {
  elements.deviceToggle.disabled = isLoading;
  elements.deviceToggle.style.opacity = isLoading ? "0.65" : "1";
}

function openGuideDialog() {
  if (typeof elements.guideDialog.showModal === "function") {
    elements.guideDialog.showModal();
  } else {
    elements.guideDialog.setAttribute("open", "");
  }
}

function updateLastSyncTime() {
  const now = new Date();
  elements.lastSyncTime.textContent = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    CONFIG.requestTimeoutMs
  );

  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function showToast(title, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <p>${escapeHtml(message)}</p>
  `;

  elements.toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function debounce(callback, wait) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(...args), wait);
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
