# Online FlowChart-Recognition and Code Generation

This project is done as a part of CSCE 624 - Sketch Recognition coursework. We have built a web application for hand drawn flowchart recognition and automatic pseudocode generation in real-time. We also provide the feature of checking the validity of the drawn flowchart using a set of predefined rules. The evaluation metrics for the recognition of each of the symbols used per user session can also be viewed in the user interface of the application.The list of available symbols are also provided in the interface for user's convenience.

The application is deployed in AWS: [link](http://flowchart.us-west-2.elasticbeanstalk.com)

* Using Paper.js
* Using Sketch Recognition
* Using AWS for deployment 

## Running the application locally

	npm install
	node main.js

Navigate to `localhost:8080`.
