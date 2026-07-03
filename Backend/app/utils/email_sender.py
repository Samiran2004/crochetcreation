import logging
import base64
from typing import Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("app.email")

# Premium HTML email template for Crochet Creation
BREVO_HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - Crochet Creation</title>
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
            background-color: #FFE082;
            color: #7F5F00;
        }}
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
            <div class="welcome-text">Thank you for your order, {customer_name}!</div>
            <p>We have successfully received your order and our artisans are preparing to craft it with care. Here is your order breakdown summary:</p>
            
            <div class="card">
                <strong>Order Reference ID:</strong> {order_id}<br>
                <strong>Payment Method:</strong> {payment_method}<br>
                <strong>Status:</strong> <span class="status-badge">Pending</span>
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
            <p>If you have any questions or customization requests, feel free to contact us.</p>
            <p>Warmest stitches,<br><strong>The Crochet Creation Team 🧶</strong></p>
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

async def send_order_email(
    to_email: str, 
    customer_name: str, 
    order_details: dict, 
    pdf_bytes: Optional[bytes] = None
):
    """
    Asynchronously sends an order confirmation email using the Brevo HTTP REST API.
    Optionally attaches a PDF invoice.
    """
    api_key = settings.BREVO_API_KEY
    sender_email = settings.SENDER_EMAIL

    if not api_key:
        logger.warning("BREVO_API_KEY is not set. Order email skipped.")
        return

    # Extract order metadata
    order_id = str(order_details.get("_id") or order_details.get("id", "N/A"))
    total_amount = order_details.get("total_amount", 0.0)
    payment_method = order_details.get("payment_method", "COD")
    items = order_details.get("items", [])

    # Format the items ordered as HTML table rows
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

    # Format the complete HTML content
    html_content = BREVO_HTML_TEMPLATE.format(
        customer_name=customer_name,
        order_id=order_id,
        payment_method=payment_method,
        items_rows=items_rows,
        total_amount=total_amount
    )

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {"name": "Crochet Creation", "email": sender_email},
        "to": [{"email": to_email, "name": customer_name}],
        "subject": f"Your Crochet Creation Order Confirmation - #{order_id[-6:] if len(order_id) > 6 else order_id} 🧶",
        "htmlContent": html_content
    }

    if pdf_bytes:
        base64_pdf = base64.b64encode(pdf_bytes).decode('utf-8')
        payload["attachment"] = [
            {
                "content": base64_pdf,
                "name": f"Invoice_CrochetCreation_{order_id}.pdf"
            }
        ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            if response.status_code >= 400:
                logger.error(
                    f"Brevo API error: Status Code {response.status_code}. Response: {response.text}"
                )
            else:
                logger.info(f"Order confirmation email sent successfully to {to_email} via Brevo API.")
    except Exception as e:
        logger.error(f"Failed to send order email to {to_email} via Brevo API: {str(e)}")
