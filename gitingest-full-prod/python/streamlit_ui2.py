import streamlit as st
import requests

st.title("Gitingest-Full — Streamlit RAG Explorer")

repo = st.text_input("Repo URL to ingest")
if st.button("Ingest"):
    st.write(requests.post("http://localhost:3000/ingest", json={"repoUrl": repo}).json())

q = st.text_input("Ask a question")
if st.button("Search"):
    r = requests.post("http://localhost:3000/query", json={"query": q, "top": 5})
    st.write(r.json())
