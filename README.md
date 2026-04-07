# ResuMatch

ResuMatch is a comprehensive platform connecting job seekers with employers, featuring an advanced AI-powered matching system.

## Core Feature: Similarity Scoring

The main feature of the project is its advanced candidate-to-job matching algorithm.

The similarity score in the ResuMatch system is calculated using **TF-IDF (Term Frequency–Inverse Document Frequency)** and **cosine similarity** techniques. First, TF-IDF is used to convert the text data from job seekers’ skills and job descriptions into numerical vectors by assigning importance to each word based on how frequently it appears in a document and how unique it is across all documents. This helps highlight important keywords while reducing the weight of common words. After that, cosine similarity is applied to measure how similar these two vectors are by calculating the cosine of the angle between them. The result is a value between 0 and 1, where a higher value indicates a stronger match between the candidate’s skills and the job requirements. This score is then converted into a percentage and used to rank candidates or jobs based on their relevance.

## Running the Application

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend/frontend
npm install
npm run dev
```
