import os
import json
import urllib.request
import urllib.error
import logging
from typing import List, Optional
from fastapi import BackgroundTasks
from app.core.config import settings

logger = logging.getLogger("app.email")

def send_email_raw(to_emails: List[str], subject: str, html_content: str, from_email: Optional[str] = None) -> bool:
    """
    Sends an email using the Resend API via Python's standard library urllib.
    """
    api_key = settings.RESEND_API_KEY
    if not api_key:
        logger.warning("RESEND_API_KEY is not set. Email not sent.")
        return False
        
    sender = from_email or settings.EMAIL_FROM
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "User-Agent": "CrochetCreationMailer/1.0"
    }
    
    payload = {
        "from": f"CrochetCreation <{sender}>",
        "to": to_emails,
        "subject": subject,
        "html": html_content
    }
    
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            logger.info(f"Email sent successfully. Resend response: {res_body}")
            return True
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        logger.error(f"HTTP Error sending email: {e.code} - {e.reason}. Detail: {error_body}")
        return False
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

# Base email layout styling
BASE_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #F8F5F2;
            margin: 0;
            padding: 0;
            color: #3E3E3E;
        }}
        .container {{
            max-width: 600px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
            border: 1px solid #EAE2D5;
        }}
        .header {{
            background-color: #6D4C41;
            padding: 35px 20px;
            text-align: center;
            border-bottom: 4px solid #8D6E63;
        }}
        .header h1 {{
            color: #FAF6F0;
            margin: 0;
            font-size: 26px;
            font-weight: 600;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}
        .header p {{
            color: #D7CCC8;
            margin: 5px 0 0 0;
            font-size: 13px;
            letter-spacing: 1px;
        }}
        .content {{
            padding: 40px 30px;
            line-height: 1.6;
        }}
        .welcome-text {{
            font-size: 18px;
            font-weight: 500;
            color: #4E342E;
            margin-bottom: 20px;
        }}
        .card {{
            background-color: #FAF6F0;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            border-left: 4px solid #8D6E63;
        }}
        .button-container {{
            text-align: center;
            margin: 30px 0;
        }}
        .button {{
            background-color: #8D6E63;
            color: #FFFFFF !important;
            padding: 12px 30px;
            text-decoration: none;
            font-weight: 600;
            border-radius: 6px;
            display: inline-block;
            box-shadow: 0 4px 10px rgba(141, 110, 99, 0.2);
            transition: all 0.3s ease;
        }}
        .footer {{
            background-color: #4E342E;
            color: #D7CCC8;
            text-align: center;
            padding: 25px 20px;
            font-size: 12px;
            line-height: 1.5;
        }}
        .footer a {{
            color: #FAF6F0;
            text-decoration: underline;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .table th {{
            text-align: left;
            padding: 10px;
            border-bottom: 2px solid #8D6E63;
            color: #4E342E;
            font-weight: 600;
        }}
        .table td {{
            padding: 12px 10px;
            border-bottom: 1px solid #EAE2D5;
        }}
        .total-row td {{
            font-weight: bold;
            color: #4E342E;
            font-size: 16px;
            border-top: 2px solid #8D6E63;
            border-bottom: none;
        }}
        .status-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .status-pending {{ background-color: #FFE082; color: #8F6B00; }}
        .status-processing {{ background-color: #B3E5FC; color: #0277BD; }}
        .status-delivered {{ background-color: #C8E6C9; color: #2E7D32; }}
        .status-cancelled {{ background-color: #FFCDD2; color: #C62828; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CrochetCreation</h1>
            <p>Handmade Crochet Artistry & Custom Patterns</p>
        </div>
        <div class="content">
            {body_content}
        </div>
        <div class="footer">
            <p>This email was sent by CrochetCreation.</p>
            <p>&copy; 2026 CrochetCreation. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@samiransamanta.in">support@samiransamanta.in</a></p>
        </div>
    </div>
</body>
</html>
"""

def queue_welcome_email(background_tasks: BackgroundTasks, user_data: dict):
    """
    Queues a beautiful welcome email with custom SVG animations and dynamic user data to the newly registered customer.
    """
    from datetime import datetime
    first_name = user_data.get("first_name", "Valued Customer")
    last_name = user_data.get("last_name", "")
    to_email = user_data.get("email")
    mobile = user_data.get("mobile", "N/A")
    date_joined = datetime.utcnow().strftime("%B %d, %Y")
    
    subject = f"Welcome to the Cozy World of CrochetCreation, {first_name}! 🧶"
    
    # Beautiful animated SVG crochet graphic
    svg_graphic = """
    <div style="text-align: center; margin: 20px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160" style="display: inline-block;">
        <style>
          @keyframes hookWiggle {
            0%, 100% { transform: rotate(-5deg) translate(0px, 0px); }
            50% { transform: rotate(10deg) translate(-5px, -8px); }
          }
          @keyframes ballPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.04); }
          }
          @keyframes threadDash {
            to { stroke-dashoffset: -20; }
          }
          .hook-group {
            animation: hookWiggle 2.5s ease-in-out infinite;
            transform-origin: 120px 80px;
          }
          .ball-group {
            animation: ballPulse 3.5s ease-in-out infinite;
            transform-origin: 95px 115px;
          }
          .moving-thread {
            stroke-dasharray: 6, 6;
            animation: threadDash 4s linear infinite;
          }
        </style>
        
        <!-- Drop Shadow -->
        <ellipse cx="100" cy="165" rx="60" ry="12" fill="#EADCC9" opacity="0.6" />
        
        <!-- Yarn Ball -->
        <g class="ball-group">
          <circle cx="95" cy="115" r="45" fill="#8D6E63" />
          <!-- Inner Textured Loops -->
          <path d="M60,100 C75,75 115,75 130,100" fill="none" stroke="#FAF6F0" stroke-width="3" opacity="0.75" />
          <path d="M55,115 C75,90 115,90 135,115" fill="none" stroke="#FAF6F0" stroke-width="3.5" opacity="0.85" />
          <path d="M60,130 C75,155 115,155 130,130" fill="none" stroke="#FAF6F0" stroke-width="3" opacity="0.75" />
          
          <path d="M75,80 C95,95 95,135 75,150" fill="none" stroke="#5D4037" stroke-width="2.5" opacity="0.6" />
          <path d="M95,73 C115,90 115,140 95,157" fill="none" stroke="#FAF6F0" stroke-width="3" opacity="0.8" />
          <path d="M110,80 C125,95 125,135 110,150" fill="none" stroke="#5D4037" stroke-width="2.5" opacity="0.6" />
        </g>
        
        <!-- Thread -->
        <path class="moving-thread" d="M135,125 C165,130 185,100 155,75 C125,50 115,35 135,15" fill="none" stroke="#C08A74" stroke-width="3" stroke-linecap="round" />
        
        <!-- Hook -->
        <g class="hook-group">
          <!-- Metallic shaft -->
          <path d="M65,145 L145,65" stroke="#B0BEC5" stroke-width="5.5" stroke-linecap="round" />
          <!-- Hook tip -->
          <path d="M61,149 C57,153 50,151 48,145 C46,139 51,135 55,138 C58,140 60,143 60,143" fill="none" stroke="#B0BEC5" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" />
          <!-- Rosewood handle -->
          <path d="M110,100 L150,60" stroke="#5D4037" stroke-width="7.5" stroke-linecap="round" />
        </g>
      </svg>
    </div>
    """

    body = f"""
    <div style="text-align: center;">
        <span style="font-size: 11px; background-color: #EADCC9; color: #5D4037; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Cozy & Handcrafted</span>
        <h2 style="color: #4E342E; margin-top: 15px; margin-bottom: 5px; font-family: 'Outfit', sans-serif; font-size: 24px;">Welcome to CrochetCreation!</h2>
        <p style="color: #6D4C41; margin-top: 0; font-size: 15px; font-style: italic;">Where every single stitch tells a story.</p>
    </div>
    
    {svg_graphic}
    
    <div class="welcome-text">Hi {first_name},</div>
    <p>We're absolutely delighted to welcome you to our community! CrochetCreation was born out of a love for intricate, cozy, and custom handmade artistry. Whether you're looking for high-quality completed crochet apparel, custom patterns, or a fully personalized bespoke item, you've officially joined the perfect family.</p>
    
    <div class="card" style="margin-top: 25px; margin-bottom: 25px;">
        <h4 style="margin-top: 0; color: #4E342E; font-size: 16px; border-bottom: 1px solid #EAE2D5; padding-bottom: 8px;">🔐 Your Registration Details</h4>
        <table style="width: 100%; font-size: 14px; color: #5D4037;">
            <tr>
                <td style="padding: 6px 0; font-weight: 600; width: 140px;">Account Name:</td>
                <td style="padding: 6px 0;">{first_name} {last_name}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600;">Registered Email:</td>
                <td style="padding: 6px 0;">{to_email}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600;">Mobile Number:</td>
                <td style="padding: 6px 0;">{mobile}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; font-weight: 600;">Joining Date:</td>
                <td style="padding: 6px 0;">{date_joined}</td>
            </tr>
        </table>
    </div>

    <p style="margin-top: 20px;">Here are a few cozy things you can explore on your dashboard right now:</p>
    
    <table style="width: 100%; border-spacing: 0 10px; margin-bottom: 20px;">
        <tr>
            <td style="vertical-align: top; width: 40px; font-size: 22px; padding-top: 2px;">🛍️</td>
            <td style="padding-left: 10px;">
                <strong style="color: #4E342E;">Browse the Catalog</strong><br>
                <span style="font-size: 13px; color: #6D4C41;">Check out our latest collections of ready-made hats, sweaters, plushies, and custom accessories.</span>
            </td>
        </tr>
        <tr>
            <td style="vertical-align: top; width: 40px; font-size: 22px; padding-top: 2px;">🎨</td>
            <td style="padding-left: 10px;">
                <strong style="color: #4E342E;">Bespoke Colorway Studio</strong><br>
                <span style="font-size: 13px; color: #6D4C41;">Mix and match colors, patterns, and stitch types to request a completely custom-made item from our workshop.</span>
            </td>
        </tr>
    </table>

    <div class="button-container">
        <a href="https://samiransamanta.in" class="button" style="background-color: #8D6E63; color: #FFFFFF; font-size: 15px; letter-spacing: 0.5px;">Explore Our Collections</a>
    </div>

    <p style="border-top: 1px dashed #EAE2D5; padding-top: 20px; font-size: 14px; color: #6D4C41;">
        <strong>Need support or custom commissions?</strong><br>
        Simply reply to this email, or reach out directly to us at <a href="mailto:support@samiransamanta.in" style="color: #8D6E63; font-weight: bold; text-decoration: none;">support@samiransamanta.in</a>. We are here to bring your creative crochet designs to life!
    </p>
    
    <p style="margin-bottom: 0;">Warmest stitches,</p>
    <p style="margin-top: 5px; font-family: 'Outfit', sans-serif; font-weight: bold; color: #4E342E; font-size: 16px;">The CrochetCreation Team 🧶</p>
    """
    
    html = BASE_HTML_TEMPLATE.format(title="Welcome to CrochetCreation", body_content=body)
    background_tasks.add_task(send_email_raw, [to_email], subject, html)

def queue_order_confirmation(background_tasks: BackgroundTasks, order_data: dict):
    """
    Queues order confirmation email to the customer, and an alert email to the admin.
    """
    customer_email = order_data.get("customer_email")
    customer_name = order_data.get("customer_name")
    order_id = str(order_data.get("_id") or order_data.get("id", "N/A"))
    total_amount = order_data.get("total_amount", 0.0)
    payment_method = order_data.get("payment_method", "COD")
    items = order_data.get("items", [])
    
    # 1. Customer Email
    subject_customer = f"Your CrochetCreation Order Confirmation - #{order_id[-6:] if len(order_id) > 6 else order_id} 🛍️"
    
    items_rows = ""
    for item in items:
        price = item.get("price", 0.0)
        qty = item.get("quantity", 1)
        subtotal = price * qty
        items_rows += f"""
        <tr>
            <td>{item.get("title", "Product")}</td>
            <td>₹{price:.2f}</td>
            <td>{qty}</td>
            <td>₹{subtotal:.2f}</td>
        </tr>
        """
        
    body_customer = f"""
    <div class="welcome-text">Thank you for your order, {customer_name}!</div>
    <p>We've received your order and are preparing to craft it with care. Here is your order breakdown summary:</p>
    
    <div class="card" style="padding: 15px;">
        <strong>Order Reference ID:</strong> {order_id}<br>
        <strong>Payment Method:</strong> {payment_method}<br>
        <strong>Status:</strong> <span class="status-badge status-pending">Pending</span>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {items_rows}
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">Grand Total:</td>
                <td>₹{total_amount:.2f}</td>
            </tr>
        </tbody>
    </table>
    
    <p>Our artisans will begin processing your items shortly. You will receive email notifications as the status of your order updates.</p>
    <p>Warmest stitches,<br><strong>CrochetCreation Support</strong></p>
    """
    
    html_customer = BASE_HTML_TEMPLATE.format(title="Order Confirmation", body_content=body_customer)
    background_tasks.add_task(send_email_raw, [customer_email], subject_customer, html_customer)
    
    # 2. Admin Alert Email
    admin_email = "samiran.samanta.dev@gmail.com"  # Admin email address
    subject_admin = f"🚨 New Order Received! - #{order_id[-6:] if len(order_id) > 6 else order_id} (₹{total_amount:.2f})"
    
    body_admin = f"""
    <div class="welcome-text">New Order Alert!</div>
    <p>A new order has been placed on CrochetCreation. Here are the details:</p>
    
    <div class="card">
        <strong>Customer Details:</strong><br>
        Name: {customer_name}<br>
        Email: {customer_email}<br>
        Mobile: {order_data.get("customer_mobile", "N/A")}
    </div>
    
    <div class="card">
        <strong>Order Summary:</strong><br>
        Order ID: {order_id}<br>
        Payment Method: {payment_method}<br>
        Total Amount: ₹{total_amount:.2f}
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Item</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {items_rows}
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">Grand Total:</td>
                <td>₹{total_amount:.2f}</td>
            </tr>
        </tbody>
    </table>
    
    <div class="button-container">
        <a href="http://localhost:3000/admin/orders" class="button">View Orders Dashboard</a>
    </div>
    """
    
    html_admin = BASE_HTML_TEMPLATE.format(title="New Order Notification", body_content=body_admin)
    background_tasks.add_task(send_email_raw, [admin_email], subject_admin, html_admin)

def queue_order_status_update(background_tasks: BackgroundTasks, order_data: dict):
    """
    Queues order status update notification to the customer.
    """
    customer_email = order_data.get("customer_email")
    customer_name = order_data.get("customer_name")
    order_id = str(order_data.get("_id") or order_data.get("id", "N/A"))
    status = order_data.get("status", "Pending")
    
    subject = f"Your CrochetCreation Order #{order_id[-6:] if len(order_id) > 6 else order_id} is now {status}! 🚚"
    
    status_class = f"status-{status.lower()}"
    
    status_explanations = {
        "Pending": "We have received your order request and are verifying details.",
        "Processing": "Our artisans are now handcrafting your crochet items. Every loop is being made with care!",
        "Delivered": "Your custom crochet order has been successfully shipped and delivered. We hope you love it!",
        "Cancelled": "Your order has been cancelled. If you have questions, please reach out to support."
    }
    explanation = status_explanations.get(status, "The status of your order has been updated.")
    
    body = f"""
    <div class="welcome-text">Hi {customer_name},</div>
    <p>We wanted to let you know that the status of your order has been updated.</p>
    
    <div class="card" style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 120px; font-weight: bold; border: none; padding: 5px 0;">Order ID:</td>
                <td style="border: none; padding: 5px 0;">{order_id}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; border: none; padding: 5px 0;">New Status:</td>
                <td style="border: none; padding: 5px 0;">
                    <span class="status-badge {status_class}">{status}</span>
                </td>
            </tr>
        </table>
    </div>
    
    <p style="font-size: 16px; color: #4E342E; font-weight: 500;">What this means:</p>
    <p>{explanation}</p>
    
    <p>If you have any questions about this update, please don't hesitate to reply directly to this email.</p>
    <p>Warmest stitches,<br><strong>CrochetCreation Support</strong></p>
    """
    
    html = BASE_HTML_TEMPLATE.format(title="Order Status Updated", body_content=body)
    background_tasks.add_task(send_email_raw, [customer_email], subject, html)


def queue_otp_email(background_tasks: BackgroundTasks, to_email: str, otp: str):
    """
    Queues a beautiful password reset OTP email with custom styling.
    """
    subject = "Reset Your CrochetCreation Password 🔑"
    
    svg_graphic = """
    <div style="text-align: center; margin: 20px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120" style="display: inline-block;">
        <style>
          @keyframes keySpin {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(15deg) scale(1.05); }
            100% { transform: rotate(0deg) scale(1); }
          }
          .key-group {
            animation: keySpin 3s ease-in-out infinite;
            transform-origin: 100px 100px;
          }
        </style>
        <circle cx="100" cy="100" r="50" fill="#FAF6F0" />
        <circle cx="100" cy="100" r="45" fill="#EADCC9" opacity="0.3" />
        
        <g class="key-group">
          <circle cx="100" cy="80" r="20" fill="none" stroke="#8D6E63" stroke-width="6" />
          <circle cx="100" cy="80" r="8" fill="#FAF6F0" />
          <path d="M100,100 L100,145" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
          <path d="M100,120 L115,120" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
          <path d="M100,135 L115,135" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
        </g>
      </svg>
    </div>
    """
    
    body = f"""
    <div style="text-align: center;">
        <span style="font-size: 11px; background-color: #FFCDD2; color: #C62828; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Security Alert</span>
        <h2 style="color: #4E342E; margin-top: 15px; margin-bottom: 5px; font-family: 'Outfit', sans-serif; font-size: 22px;">Reset Your Password</h2>
        <p style="color: #6D4C41; margin-top: 0; font-size: 14px;">We received a request to reset your CrochetCreation account password.</p>
    </div>
    
    {{svg_graphic}}
    
    <div class="welcome-text">Hello,</div>
    <p>Please use the following 6-digit One-Time Password (OTP) to verify your request and set a new password. **This OTP will expire in 10 minutes.**</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background-color: #FAF6F0; border: 2px dashed #8D6E63; border-radius: 12px; padding: 15px 35px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4E342E; box-shadow: 0 4px 10px rgba(141, 110, 99, 0.05);">
            {{otp}}
        </div>
    </div>
    
    <div class="card" style="border-left-color: #C62828; background-color: #FFEBEE; color: #C62828; font-size: 13px;">
        <strong>⚠️ Didn't request this change?</strong><br>
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged, and your account is secure.
    </div>
    
    <p style="margin-top: 25px; border-top: 1px dashed #EAE2D5; padding-top: 15px; font-size: 12px; color: #8D6E63;">
        For security reasons, never share this OTP with anyone. CrochetCreation support staff will never ask for your passwords or OTP verification codes.
    </p>
    
    <p style="margin-bottom: 0;">Warmest stitches,</p>
    <p style="margin-top: 5px; font-family: 'Outfit', sans-serif; font-weight: bold; color: #4E342E; font-size: 16px;">The CrochetCreation Security Team 🧶</p>
    """
    
    formatted_body = body.replace("{{svg_graphic}}", svg_graphic).replace("{{otp}}", otp)
    html = BASE_HTML_TEMPLATE.format(title="Reset Your Password", body_content=formatted_body)
    background_tasks.add_task(send_email_raw, [to_email], subject, html)
