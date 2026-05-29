// src/lib/facebook.js

export const loadFacebookSDK = () => {
  return new Promise((resolve) => {
    if (window.FB) {
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID, // Vite
        cookie: true,
        xfbml: true,
        version: "v23.0",
      });

      window.FB.AppEvents.logPageView();

      resolve(window.FB);
    };

    const existingScript = document.getElementById("facebook-jssdk");

    if (!existingScript) {
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;

      document.body.appendChild(js);
    }
  });
};
