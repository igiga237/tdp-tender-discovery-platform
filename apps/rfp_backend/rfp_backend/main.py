from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)

CORS(app)

import spacy
from spacy_layout import spaCyLayout

nlp = spacy.load("en_core_web_sm")


layout = spaCyLayout(nlp)

doc = layout("./sample_rfp_document.pdf")

analyzed_doc = nlp(doc.text)

entities = [(ent.text, ent.label_) for ent in analyzed_doc.ents]


@app.route('/', methods=['GET'])
def home():
    return entities

if __name__ == '__main__':
    
    port = int(os.getenv("PORT", 4500))

    app.run(host='0.0.0.0',
            port=port,
            debug=True)
