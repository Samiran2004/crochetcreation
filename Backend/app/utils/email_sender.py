import logging
import base64
import os
from typing import Optional
import httpx
from app.utils.pdf_generator import generate_invoice_pdf

logger = logging.getLogger("app.email")

# Common styling container for all Brevo-dispatched emails
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
            background-color: #FAF6F0;
            margin: 0;
            padding: 0;
            color: #3E2723;
        }}
        .container {{
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(62, 39, 35, 0.05);
            border: 1px solid #EFEAE2;
        }}
        .header {{
            background: linear-gradient(135deg, #8D6E63 0%, #5D4037 100%);
            padding: 40px 20px;
            text-align: center;
            border-bottom: 5px solid #A1887F;
        }}
        .header h1 {{
            color: #FFFDF9;
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }}
        .header p {{
            color: #E0D4C5;
            margin: 8px 0 0 0;
            font-size: 14px;
            letter-spacing: 1px;
            font-style: italic;
        }}
        .content {{
            padding: 40px 35px;
            line-height: 1.7;
        }}
        .welcome-text {{
            font-size: 18px;
            font-weight: 600;
            color: #4E342E;
            margin-bottom: 15px;
        }}
        .card {{
            background-color: #FFFDF9;
            border-radius: 10px;
            padding: 20px;
            margin: 25px 0;
            border: 1px solid #EFEAE2;
            border-left: 5px solid #8D6E63;
        }}
        .table {{
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
        }}
        .table th {{
            text-align: left;
            padding: 12px 10px;
            border-bottom: 2px solid #8D6E63;
            color: #4E342E;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .table td {{
            padding: 14px 10px;
            border-bottom: 1px solid #F5EFEB;
            font-size: 14px;
            color: #5D4037;
        }}
        .total-row td {{
            font-weight: bold;
            color: #4E342E;
            font-size: 16px;
            border-top: 2px solid #8D6E63;
            border-bottom: none;
            padding-top: 18px;
        }}
        .status-badge {{
            display: inline-block;
            padding: 5px 14px;
            border-radius: 20px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        .status-pending {{ background-color: #FFE082; color: #7F5F00; }}
        .status-confirmed {{ background-color: #C8E6C9; color: #2E7D32; }}
        .footer {{
            background-color: #3E2723;
            color: #D7CCC8;
            text-align: center;
            padding: 30px 20px;
            font-size: 12px;
            line-height: 1.6;
        }}
        .footer a {{
            color: #FFFDF9;
            text-decoration: underline;
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
        .yarn-ball {{
            display: inline-block;
            font-size: 24px;
            margin-bottom: 10px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="yarn-ball">🧶</div>
            <h1>Crochet Creation</h1>
            <p>Handmade Crochet Artistry & Custom Designs</p>
        </div>
        <div class="content">
            {body_content}
        </div>
        <div class="footer">
            <p>This email was sent by Crochet Creation.</p>
            <p>&copy; 2026 Crochet Creation. All rights reserved.</p>
            <p>Need help? Contact us at <a href="mailto:support@samiransamanta.in">support@samiransamanta.in</a></p>
        </div>
    </div>
</body>
</html>
"""

async def send_brevo_email(to_email: str, name: str, subject: str, html_content: str, attachment: Optional[dict] = None) -> bool:
    """
    Core helper to send emails via the Brevo HTTP REST API.
    """
    api_key = os.getenv("BREVO_API_KEY")
    sender_email = os.getenv("SENDER_EMAIL", "crochetcreation.online@gmail.com")

    if not api_key:
        logger.warning("BREVO_API_KEY is not set. Email dispatch aborted.")
        return False

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {"name": "Crochet Creation", "email": sender_email},
        "to": [{"email": to_email, "name": name}],
        "subject": subject,
        "htmlContent": html_content
    }

    if attachment:
        payload["attachment"] = [attachment]

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code >= 400:
                logger.error(f"Brevo API error: {response.status_code} - {response.text}")
                return False
            logger.info(f"Email sent successfully via Brevo to {to_email}")
            return True
    except Exception as e:
        logger.error(f"HTTP exception sending email to {to_email}: {str(e)}")
        return False

async def send_order_email(
    to_email: str, 
    customer_name: str, 
    order_details: dict, 
    pdf_bytes: Optional[bytes] = None
):
    """
    Sends an order confirmation email via Brevo REST API with an optional PDF attachment.
    """
    order_id = str(order_details.get("_id") or order_details.get("id", "N/A"))
    total_amount = order_details.get("total_amount", 0.0)
    payment_method = order_details.get("payment_method", "COD")
    items = order_details.get("items", [])
    status = order_details.get("status", "Pending")

    status_badge_class = "status-pending" if status == "Pending Validation" else "status-confirmed"

    # Format items table rows
    items_rows = ""
    for item in items:
        title = item.get("title", "Product")
        qty = item.get("quantity", 1)
        price = item.get("price", 0.0)
        subtotal = price * qty
        items_rows += f"""
        <tr>
            <td>{title}</td>
            <td style="text-align: center;">{qty}</td>
            <td style="text-align: right;">₹{price:.2f}</td>
            <td style="text-align: right;">₹{subtotal:.2f}</td>
        </tr>
        """

    body = f"""
    <div class="welcome-text">Thank you for your order, {customer_name}!</div>
    <p>Here is your order breakdown summary:</p>
    
    <div class="card">
        <strong>Order Reference ID:</strong> {order_id}<br>
        <strong>Payment Method:</strong> {payment_method}<br>
        <strong>Status:</strong> <span class="status-badge {status_badge_class}">{status}</span>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            {items_rows}
            <tr class="total-row">
                <td colspan="3" style="text-align: right;">Grand Total:</td>
                <td style="text-align: right;">₹{total_amount:.2f}</td>
            </tr>
        </tbody>
    </table>
    
    <p>Our artisans will begin processing your items shortly. We will keep you updated as the status of your order progresses.</p>
    <p>Warmest stitches,<br><strong>The Crochet Creation Team 🧶</strong></p>
    """

    html_content = BASE_HTML_TEMPLATE.format(title="Order Confirmation", body_content=body)
    subject = f"Your Crochet Creation Order Confirmation - #{order_id[-6:] if len(order_id) > 6 else order_id} 🧶"

    attachment = None
    if pdf_bytes:
        base64_pdf = base64.b64encode(pdf_bytes).decode('utf-8')
        attachment = {
            "content": base64_pdf,
            "name": f"Invoice_CrochetCreation_{order_id}.pdf"
        }

    success = await send_brevo_email(to_email, customer_name, subject, html_content, attachment)

    # Update database directly to reflect email delivery status
    try:
        from app.core.db import get_database
        from bson import ObjectId
        db = get_database()
        if db is not None:
            o_id = order_details.get("_id") or order_details.get("id")
            if o_id:
                # Ensure we have ObjectId format
                query_id = ObjectId(o_id) if isinstance(o_id, str) else o_id
                await db["orders"].update_one(
                    {"_id": query_id},
                    {"$set": {"email_sent": success}}
                )
                logger.info(f"Updated order {o_id} email_sent status to {success}")
    except Exception as db_err:
        logger.error(f"Error updating order email_sent status in DB: {db_err}")

    return success

async def generate_and_send_invoice_task(to_email: str, name: str, order_data: dict):
    """
    Background task to generate PDF invoice entirely in-memory and send it
    via the Brevo API as an email attachment.
    """
    try:
        pdf_bytes = await generate_invoice_pdf(order_data)
        await send_order_email(to_email, name, order_data, pdf_bytes)
    except Exception as e:
        logger.error(f"Error generating/sending invoice: {str(e)}")
        try:
            from app.core.db import get_database
            from bson import ObjectId
            db = get_database()
            o_id = order_data.get("_id") or order_data.get("id")
            if db is not None and o_id:
                query_id = ObjectId(o_id) if isinstance(o_id, str) else o_id
                await db["orders"].update_one(
                    {"_id": query_id},
                    {"$set": {"email_sent": False}}
                )
        except Exception as db_err:
            logger.error(f"Error updating failed invoice email status in DB: {db_err}")

async def send_welcome_email(to_email: str, first_name: str, last_name: str, mobile: str):
    """
    Sends a welcome email to newly registered users via Brevo REST API.
    """
    subject = f"Welcome to the Cozy World of Crochet Creation, {first_name}! 🧶"
    
    svg_graphic = """
    <div style="text-align: center; margin: 20px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="160" height="160" style="display: inline-block;">
        <ellipse cx="100" cy="165" rx="60" ry="12" fill="#EADCC9" opacity="0.6" />
        <circle cx="95" cy="115" r="45" fill="#8D6E63" />
        <path d="M60,100 C75,75 115,75 130,100" fill="none" stroke="#FAF6F0" stroke-width="3" opacity="0.75" />
        <path d="M55,115 C75,90 115,90 135,115" fill="none" stroke="#FAF6F0" stroke-width="3.5" opacity="0.85" />
        <path d="M60,130 C75,155 115,155 130,130" fill="none" stroke="#FAF6F0" stroke-width="3" opacity="0.75" />
        <path d="M65,145 L145,65" stroke="#B0BEC5" stroke-width="5.5" stroke-linecap="round" />
        <path d="M110,100 L150,60" stroke="#5D4037" stroke-width="7.5" stroke-linecap="round" />
      </svg>
    </div>
    """

    body = f"""
    <div style="text-align: center;">
        <span style="font-size: 11px; background-color: #EADCC9; color: #5D4037; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Cozy & Handcrafted</span>
        <h2 style="color: #4E342E; margin-top: 15px; margin-bottom: 5px; font-size: 24px;">Welcome to Crochet Creation!</h2>
        <p style="color: #6D4C41; margin-top: 0; font-size: 15px; font-style: italic;">Where every single stitch tells a story.</p>
    </div>
    
    {svg_graphic}
    
    <div class="welcome-text">Hi {first_name},</div>
    <p>We're absolutely delighted to welcome you to our community! Crochet Creation was born out of a love for intricate, cozy, and custom handmade artistry. Whether you're looking for high-quality completed crochet apparel, custom patterns, or a fully personalized bespoke item, you've officially joined the perfect family.</p>
    
    <div class="card" style="margin-top: 25px; margin-bottom: 25px;">
        <h4 style="margin-top: 0; color: #4E342E; font-size: 16px; border-bottom: 1px solid #EFEAE2; padding-bottom: 8px;">🔐 Your Registration Details</h4>
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
        </table>
    </div>

    <div class="button-container">
        <a href="https://samiransamanta.in" class="button">Explore Our Collections</a>
    </div>

    <p style="border-top: 1px dashed #EFEAE2; padding-top: 20px; font-size: 14px; color: #6D4C41;">
        <strong>Need support or custom commissions?</strong><br>
        Reach out to us at <a href="mailto:support@samiransamanta.in" style="color: #8D6E63; font-weight: bold; text-decoration: none;">support@samiransamanta.in</a>. We are here to bring your creative crochet designs to life!
    </p>
    
    <p style="margin-bottom: 0;">Warmest stitches,</p>
    <p style="margin-top: 5px; font-weight: bold; color: #4E342E; font-size: 16px;">The Crochet Creation Team 🧶</p>
    """

    html_content = BASE_HTML_TEMPLATE.format(title="Welcome to Crochet Creation", body_content=body)
    await send_brevo_email(to_email, f"{first_name} {last_name}", subject, html_content)

async def send_otp_email(to_email: str, otp: str):
    """
    Sends password reset OTP email using Brevo REST API.
    """
    subject = "Reset Your Crochet Creation Password 🔑"
    
    svg_graphic = """
    <div style="text-align: center; margin: 20px 0;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="120" height="120" style="display: inline-block;">
        <circle cx="100" cy="100" r="50" fill="#FAF6F0" />
        <circle cx="100" cy="100" r="45" fill="#EADCC9" opacity="0.3" />
        <circle cx="100" cy="80" r="20" fill="none" stroke="#8D6E63" stroke-width="6" />
        <circle cx="100" cy="80" r="8" fill="#FAF6F0" />
        <path d="M100,100 L100,145" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
        <path d="M100,120 L115,120" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
        <path d="M100,135 L115,135" stroke="#8D6E63" stroke-width="6" stroke-linecap="round" />
      </svg>
    </div>
    """
    
    body = f"""
    <div style="text-align: center;">
        <span style="font-size: 11px; background-color: #FFCDD2; color: #C62828; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Security Alert</span>
        <h2 style="color: #4E342E; margin-top: 15px; margin-bottom: 5px; font-size: 22px;">Reset Your Password</h2>
        <p style="color: #6D4C41; margin-top: 0; font-size: 14px;">We received a request to reset your Crochet Creation account password.</p>
    </div>
    
    {svg_graphic}
    
    <div class="welcome-text">Hello,</div>
    <p>Please use the following 6-digit One-Time Password (OTP) to verify your request and set a new password. **This OTP will expire in 10 minutes.**</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background-color: #FAF6F0; border: 2px dashed #8D6E63; border-radius: 12px; padding: 15px 35px; font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4E342E;">
            {otp}
        </div>
    </div>
    
    <div class="card" style="border-left-color: #C62828; background-color: #FFEBEE; color: #C62828; font-size: 13px;">
        <strong>⚠️ Didn't request this change?</strong><br>
        If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </div>
    
    <p style="margin-top: 25px; border-top: 1px dashed #EFEAE2; padding-top: 15px; font-size: 12px; color: #8D6E63;">
        For security reasons, never share this OTP with anyone.
    </p>
    
    <p style="margin-bottom: 0;">Warmest stitches,</p>
    <p style="margin-top: 5px; font-weight: bold; color: #4E342E; font-size: 16px;">The Crochet Creation Security Team 🧶</p>
    """
    
    html_content = BASE_HTML_TEMPLATE.format(title="Reset Your Password", body_content=body)
    await send_brevo_email(to_email, "Valued Customer", subject, html_content)


async def send_review_thank_you_email(to_email: str, name: str, product_title: str):
    """
    Sends a warm thank you email to a user who has reviewed a product.
    """
    subject = "Thank You for Your Review! 💖"
    body = f"""
    <div style="text-align: center;">
        <span style="font-size: 11px; background-color: #EADCC9; color: #5D4037; padding: 4px 12px; border-radius: 20px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Review Submitted</span>
        <h2 style="color: #4E342E; margin-top: 15px; margin-bottom: 5px; font-size: 24px;">Thank You, {name}!</h2>
        <p style="color: #6D4C41; margin-top: 0; font-size: 15px; font-style: italic;">Your feedback means the world to us.</p>
    </div>
    
    <div class="welcome-text">Hi {name},</div>
    <p>Thank you so much for sharing your experience and reviewing <strong>{product_title}</strong>! Your review helps other crochet lovers in our community discover beautiful, high-quality handmade art.</p>
    <p>As a small business, every single review and word of encouragement helps us keep creating and custom-stitching these designs with love.</p>
    
    <div class="card" style="margin-top: 25px; margin-bottom: 25px;">
        <p style="margin: 0; font-style: italic; color: #5D4037;">
            "We are incredibly grateful for your support of Crochet Creation. We hope your handmade piece brings warmth and joy to your space!"
        </p>
    </div>

    <p style="border-top: 1px dashed #EFEAE2; padding-top: 20px; font-size: 14px; color: #6D4C41;">
        If you ever need any custom designs, customizations, or just want to say hi, feel free to reply to this email or reach out to us at <a href="mailto:support@samiransamanta.in" style="color: #8D6E63; font-weight: bold; text-decoration: none;">support@samiransamanta.in</a>.
    </p>
    
    <p style="margin-bottom: 0;">Warmest stitches,</p>
    <p style="margin-top: 5px; font-weight: bold; color: #4E342E; font-size: 16px;">The Crochet Creation Team 🧶</p>
    """
    html_content = BASE_HTML_TEMPLATE.format(title="Thank You for Your Review!", body_content=body)
    await send_brevo_email(to_email, name, subject, html_content)

