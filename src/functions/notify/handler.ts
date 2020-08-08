const aws = require("aws-sdk");
const ses = new aws.SES({region: "us-east-1"});
const XLSX = require("xlsx");

// Handler for Lambda event
function notify(event: any, _context: any, callback: any): void {
  if (!event.headers.origin || event.headers.origin.indexOf("school-tracing.com") === -1)
    return callback(null, createResponseObject(400, { "message": "[400] Error!  invalid origin!" }));

  console.log(JSON.stringify(event));
  let request = tryParseJSON(event.body);

  if (request === false) {
    console.log("invalid request format provided");
    return callback(null, createResponseObject(400, { "message": "[400] Error!  invalid request body!" }));
  }

  if (typeof request.email === "undefined")
    return callback(null, createResponseObject(400, { "message": "[400] Error!  email is required!" }));

  const associations = loadAssociationsFromExcel();

  console.log("Match courses for " + request.email);
  let match = null;
  for (let entry of associations) {
    if (entry.Email === request.email) {
      match = entry;
      break;
    }
  }
  if (match === null) {
    console.log("Error!  email " + request.email + " did not match any mappings!");
    return callback(null, createResponseObject(400, { "message": "[400] Error!  email did not match any mappings!" }));
  }

  let notifyTeacherList = new Set();
  let notifyStudentList = new Set();
  for (let oneCourse of match.Courses) {
    const students = getStudentsForCourse(associations, oneCourse);
    for (let oneStudent of students) notifyStudentList.add(oneStudent);
    const teachers = getTeachersForCourse(associations, oneCourse.Teacher);
    for (let oneTeacher of teachers) notifyTeacherList.add(oneTeacher);
  }

  const studentList = Array.from(notifyStudentList.values()).sort((one, two) => (one > two ? 1 : -1));
  const teacherList = Array.from(notifyTeacherList.values()).sort((one, two) => (one > two ? 1 : -1));
  let resultString = "A positive test has been registered via the Contact Tracing notification system.\n" +
    "The following (" + teacherList.length + ") faculty and (" + studentList.length + ") students may have been affected:\n\n";

  resultString += "Students: \n";
  for (let entry of studentList) resultString += entry + "\n";

  resultString += "\n\nFaculty: \n";
  for (let entry of teacherList) resultString += entry + "\n";

  const sesParams = {
    Destination: {
        ToAddresses: process.env.SEND_TO.split(",")
    },
    Message: {
        Body: { Text: { Data: resultString }},
        Subject: {
          Data: "AGS Contact Tracing Notification"
        }
    },
    Source: process.env.SEND_FROM
  };

  if (process.env.SEND_EMAIL){
    ses.sendEmail(sesParams, function (err, data) {
      if (err) {
        callback(null, createResponseObject(500, { "message": "[500] Error!", err}));
      } else {
          callback(null, createResponseObject(200, { "message": "[200] Success!", data }));
      }
    });
  } else {
    console.log(JSON.stringify(sesParams));
    return callback(null, createResponseObject(200, { "message": "[200] Success!  Did Stuff!" }));
  }
}

function loadAssociationsFromExcel() {
  const workbook = XLSX.readFile("./mappings/" + process.env.MAPPING_FILE);
  const sheetNameList = workbook.SheetNames;
  const mappingData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
  let associations = [];
  for (let entry of mappingData) {
    if ("Email" in entry) {
      delete entry.Course;
      entry.Courses = [];
      associations.push(entry);
    } else {
      if (entry.Course !== "Course")
        associations[associations.length - 1]["Courses"].push(entry);
    }
  }
  return associations;
}

function getStudentsForCourse(associations, course): string[] {
  const stringMatch = JSON.stringify(course);
  let result = [];
  for (let entry of associations) {
    for (let oneCourse of entry.Courses) {
      if (JSON.stringify(oneCourse) === stringMatch) {
        result.push(entry.Email);
        break;
      }
    }
  }
  return result;
}

function getTeachersForCourse(associations, teachers): string[] {
  let result = [];
  let splitTeachers = teachers.split(",").map(o => o.replace(" (H)", "").trim());
  for (let entry of associations) {
    const fullName = entry["First Name"] + " "  + entry["Last Name"];
    if (splitTeachers.indexOf(fullName) >= 0) {
      result.push(entry.Email);
    }
  }
  return result;
}


function tryParseJSON(jsonString: string): any {
  try {
      let o = JSON.parse(jsonString);
      console.log(o);

      if (typeof o === "object") {
          return o;
      }
  }
  catch (e) {
    console.log(e);
  }

  return false;
}

function createResponseObject (statusCode: number, body: any): any {
  const response = {
      statusCode: statusCode,
      headers: {
          "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(body),
  };

  console.log("assembled response: " + JSON.stringify(response));
  return response;
}

export { tryParseJSON, createResponseObject, notify};