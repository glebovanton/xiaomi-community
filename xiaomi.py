
import requests
import time
import random
import os

# Load cookies from environment (set in GitHub Actions secrets)
cookie_str = os.environ.get("COOKIE")
cookie_items = cookie_str.strip().split(";")
cookies = {item.split("=")[0].strip(): item.split("=")[1].strip() for item in cookie_items}

headers = {
    'User-Agent': 'Mozilla/5.0 (Android 12; Mobile; MIUI) AppleWebKit/537.36 Chrome/110.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json',
    'Cookie': cookie_str
}

comments = [
    "Nice post!", "Great!", "Very useful!", "Awesome!", "Thanks for sharing!",
    "Cool idea", "Helpful info", "Interesting", "Good job", "Love this post!",
    "Wow!", "Useful content", "Excellent", "Good explanation", "Thanks!"
]

post_ids = ['36527156', '36487110']
user_ids = ['1758101583', '1761139316', '1759944812']

def daily_checkin():
    url = 'https://c.mi.com/global/api/mission/start'
    r = requests.get(url, headers=headers)
    print("✅ Check-in:", r.status_code, r.text[:200])

def like_post(post_id):
    url = 'https://c.mi.com/global/api/thread/thumbUp'
    data = {'tid': post_id}
    r = requests.post(url, headers=headers, data=data)
    print("👍 Like:", post_id, r.status_code, r.text[:200])

def browse_post(post_id):
    url = f'https://c.mi.com/global/thread-{post_id}-1-1.html'
    r = requests.get(url, headers=headers)
    print("👁️ Browse:", post_id, r.status_code)

def comment_post(post_id):
    url = 'https://c.mi.com/global/api/thread/reply'
    comment_text = random.choice(comments)
    data = {'tid': post_id, 'content': comment_text}
    r = requests.post(url, headers=headers, data=data)
    print("💬 Comment:", post_id, r.status_code, r.text[:200])

def follow_user(uid):
    url = 'https://c.mi.com/global/api/user/follow'
    data = {'uid': uid}
    r = requests.post(url, headers=headers, data=data)
    print("➕ Follow:", uid, r.status_code, r.text[:200])

def main():
    daily_checkin()
    for pid in post_ids[:2]:
        browse_post(pid)
        time.sleep(1)
        like_post(pid)
        time.sleep(1)
        comment_post(pid)
    for uid in user_ids[:3]:
        follow_user(uid)
        time.sleep(1)

if __name__ == '__main__':
    main()
