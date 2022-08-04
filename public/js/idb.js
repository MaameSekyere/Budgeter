let db;
const request = indexedDB.open("budgeter", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetObject = transaction.objectStore("budget");
  budgetObject.add(record);
}

function uploadBudget() {
  // open a transaction on your pending db
  const transaction = db.transaction(["budget"], "readwrite");
  const budgetObject = transaction.objectStore("budget");
  const getAll = budgetObject.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["budget"], "readwrite");
          const budgetObject = transaction.objectStore("budget");
          budgetObject.clear();
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);
