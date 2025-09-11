import streamlit as st
import requests

st.title("Gitingest Full Prod Inline")
query = st.text_input("Enter query text:")

if st.button("Search"):
    results = requests.post("http://localhost:3001/query", json={"text": query}).json()
    st.json(results)
