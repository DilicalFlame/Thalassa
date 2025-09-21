import requests
session_id = "d816871f-6ef7-4910-859c-41e3bb8123aa"

resp = requests.post(
    "http://localhost:8001/chat",
    json={"session_id": session_id, "message": "compare the temperature of arabian sea with the water body I mentioned earlier."}
)

print(resp.json())
