import requests
url = "https://wizard-duel.herokuapp.com/"


# CONNECTION TEST 
print("Testing Connection to", url, ".......")
r = requests.get('https://wizard-duel.herokuapp.com/')

if r.status_code == 200:
    print("Success! Status Code:", r.status_code)
else:
    print("Failed! Cannot connect!")
    exit(1)



# PORT TEST
print("Checking for valid Port....")
port = int((r.text[r.text.find("port") + 4:]))

if port > 3000 and port < 65535:
    print ( f"SUCCESS! Port is valid: {port}")
else:
    print("FAIL, Invalid Port!")




