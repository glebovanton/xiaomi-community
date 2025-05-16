🔐 How to Insert Cookies for Authentication
This script uses your Xiaomi Community cookies for login — no username or password required. Here's how to get and use them:

✅ Step 1: Log into Xiaomi Community and copy your cookies
Go to https://c.mi.com/global and log into your account.

Open Developer Tools (F12 or Ctrl+Shift+I).

Go to the Application tab → Cookies → select https://c.mi.com.

Copy the following cookie values:

new_bbs_serviceToken ✅ (Required) new_bbs_serviceToken

cUserId ✅ (Required) cUserId

passportDeviceId (Optional)

🧾 Example cookie string
Put all values in a single line, like this:
`new_bbs_serviceToken=abc123xyz456; cUserId=7891011; passportDeviceId=device-xyz;`
If you don't see passportDeviceId, just leave it out:
`cUserId=w27I4BueIpBn3hY_Et1eG7SunRr; new_bbs_serviceToken=asj5v6aLFf3k6RLodK82a689L1ENvGmtUbOIYfWa7urpJ50W%2Fk6VrG4imGvL51qtAkevNsHVHdg9AaCE7u2Jqw2MjESBykR8MdWx%2FwZOmFC3ixPINfXPk7zpv45hHcTqTqcL5TpQHQQvRiwd7N1B2lkc9o0Z5RS32UzH6GIILNc%3B;`

✅ Step 2: Add the cookie to GitHub Secrets
Go to your forked repository → Settings → Secrets and variables → Actions.

Click New repository secret.

Add:
| Name     | Value                                  |
| -------- | -------------------------------------- |
| `COOKIE` | *(your full cookie string from above)* |
| `USER`   | *(optional, your nickname or email)*   |

✅ Done!
The script will automatically use your cookie to run daily tasks (check-in, likes, follows, etc.) via GitHub Actions.