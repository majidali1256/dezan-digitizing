from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

options = Options()
options.add_argument('--headless')
driver = webdriver.Chrome(options=options)
driver.get("http://localhost:3000/portfolio.html")

logs = driver.get_log("browser")
for log in logs:
    print(log)

driver.quit()
