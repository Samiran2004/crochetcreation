import asyncio
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

async def test():
    api_key = os.getenv("CRONJOB_API_KEY")
    print(f"API Key: {api_key}")
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    url = "https://api.cron-job.org/jobs"
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(url, headers=headers)
            print("Status:", r.status_code)
            print("Response:", r.text)
            data = r.json()
            if "jobs" in data and len(data["jobs"]) > 0:
                job_id = data["jobs"][0]["jobId"]
                history_url = f"https://api.cron-job.org/jobs/{job_id}/history"
                rh = await client.get(history_url, headers=headers)
                print("\nHistory Status:", rh.status_code)
                print("History Response:", rh.text[:1000])
        except Exception as e:
            print("Error:", e)

asyncio.run(test())
