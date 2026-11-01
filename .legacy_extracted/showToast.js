function showToast(msg) {
      const toast = document.getElementById("toastNotification");
      const text = document.getElementById("toastText");
      text.textContent = msg;
      toast.classList.remove("hidden");
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(() => {
        toast.classList.add("hidden");
      }, 2400);
    }
