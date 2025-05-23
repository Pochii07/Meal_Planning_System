module.exports.verifyEmailTemplate = 
`<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>

  <body style="margin:0;padding:0">
    <div style=" background:#fff; border-radius:8px; box-shadow:0 4px 24px rgba(0,0,0,0.15); max-width:450px; width:100%; margin:0 auto; ">
      <div style="background-color:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:450px;width:100%">
        <!-- Header Section -->
        <div style="background:#16a34a;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:white;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;margin:0">
            Enter OTP
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding:25px 15px">
          <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;font-size:20px;font-weight:bold;margin-bottom:15px;text-align:center">
            Verify your email address
          </h1>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
            This feature is enforced for everyone with access to ChefIt. We value your privacy.
          </p>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;margin-bottom:14px">
            Please use the One-Time Password (OTP) below to complete your login process. Do not share this code with anyone.
          </p> 
          <!-- Verification Code Block -->
          <div style="margin:30px 0">
            <p style="font-size:14px;line-height:24px;margin:0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;font-weight:bold;text-align:center">
              Verification code
            </p>
            <p style="font-size:36px;line-height:1.2;margin:15px 0;color:#16a34a;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;font-weight:bold;text-align:center;letter-spacing:2px">
              {verificationToken}
            </p>

          </div>

          <!-- Security Message -->
          <hr style="border:none;border-top:1px solid #eaeaea;margin:25px 0" />
          <p style="font-size:14px;line-height:24px;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;text-align:center;margin:0">
            We will never email you and ask you to disclose or verify your password or banking information.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:25px;text-align:center">
          <p style="font-size:12px;color:#666;margin:0">
              © {2025} [CHEF IT TECH] <br>All rights reserved.<br />
            </p>
        </div>
      </div>
    </div>
  </body>
</html>`;

module.exports.resetPasswordEmailTemplate = 
`<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>

  <body style="margin:0;padding:0">
    <div style=" background:#fff; border-radius:8px; box-shadow:0 5px 15px rgba(0,0,0,0.12); max-width:450px; width:100%; margin:0 auto; ">
      <div style="background-color:#fff;padding:30px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);max-width:450px;width:100%">
        <!-- Header Section -->
        <div style="background:#16a34a;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="color:white;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; font-size:28px; margin:0">
            Forgot Password Request
          </h1>
        </div>

        <!-- Main Content -->
        <div style="padding:25px 15px">
          <h1 style="color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;font-size:20px;font-weight:bold;margin-bottom:15px;text-align:center">
            Hi, {firstName}
          </h1>
          <p style="font-size:14px;line-height:24px;margin:24px 0;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
            We received a request to reset your password for. <br>Click the button below to create a new password:  
          </p>

          <!-- Add this where you want the button -->
          <div style="margin: 30px 0; text-align: center">
            <a href="{resetURL}" 
              style="
                background-color: #16a34a;
                color: white;
                padding: 10px 20px;
                border-radius: 6px;
                text-decoration: none;
                font-size: 15px;
                font-weight: 500;
                display: inline-block;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                transition: background-color 0.2s;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                width: 150px;
                margin: 0 auto;
                text-align: center;
              ">
              Reset Password
            </a>
          </div>

          <!-- Security Message -->
          <hr style="border:none;border-top:1px solid #eaeaea;margin:25px 0" />
          <p style="font-size:14px;line-height:24px;color:#333;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;text-align:center;margin:0">
            We will never email you and ask you to disclose or verify your password or banking information.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:25px;text-align:center">
          <p style="font-size:12px;color:#666;margin:0">
              © {2025} [CHEF IT TECH] <br>All rights reserved.<br />
            </p>
        </div>
      </div>
    </div>
  </body>
</html>`;