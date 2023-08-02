const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3015, () => {
      console.log("Server Running at http://localhost:3015/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertStateToObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictToObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};
const convertTotalIntoObject = (dbObject) => {
  return {
    totalCases: dbObject.cases,
    totalCured: dbObject.cured,
    totalActive: dbObject.active,
    totalDeaths: dbObject.deaths,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  const allStates = `select * from state
  order by state_id;`;
  const listOfStates = await db.all(allStates);
  const result = listOfStates.map((eachState) => {
    return convertStateToObject(eachState);
  });
  response.send(result);
});
//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `select * from state
    where state_id=${stateId};`;
  const state = await db.get(getState);
  response.send(convertStateToObject(state));
});
//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrict = `insert into
    district(district_name,state_id,cases,cured,active,deaths)
    values
    (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const dbResponse = await db.run(createDistrict);
  response.send("District Successfully Added");
});
//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `select * from district
    where district_id=${districtId};`;
  const district = await db.get(getDistrict);
  response.send(convertDistrictToObject(district));
});
//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `delete from district
    where district_id=${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});
//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `update district
    set
    district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    where
    district_id=${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});
//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getSum = `select
  sum(cases) as cases,
  sum(cured) as cured,
  sum(active) as active,
  sum(deaths) as deaths
  from district
  where state_id=${stateId};`;
  const stat = await db.get(getSum);
  response.send(convertTotalIntoObject(stat));
});
//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateName = `select state_name
    from state join district
    on
    state.state_id=district.state_id
    where district.district_id=${districtId};`;
  const state = await db.get(getStateName);
  response.send({ stateName: state.state_name });
});
module.exports = app;
