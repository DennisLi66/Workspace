//Creating Join Links
function joinLinkToggle() {
  var t = document.getElementById('toggs').checked;
  if (t) {
    document.getElementById('descriptor').innerText = 'The joiner will automatically be added into the company.';
    document.getElementById('toggler').value = 'yes';
  } else {
    document.getElementById('descriptor').innerText = '  The joiner will need to be manually verifed after using the join link.';
    document.getElementById('toggler').value = 'no';
  }
}

function joinLinkToggle2() {
  var t = document.getElementById('toggs2').checked;
  if (t) {
    document.getElementById('descriptor2').innerText = 'The code will only work for the first person who uses it.';
    document.getElementById('toggler2').value = 'yes';
  } else {
    document.getElementById('descriptor2').innerText = 'Any number of employees can join using this code.';
    document.getElementById('toggler2').value = 'no';
  }
}
//Announcement Page
function toggleAnnouncement() {
  var checkme = document.getElementById('contentOpen').value;
  console.log(checkme);
  if (checkme === 'closed') {
    document.getElementById('contentOpen').value = 'open';
    document.getElementById('addContent').style.display = 'block';
    document.getElementById('addButton').innerText = 'Hide Announcement Maker';
  } else if (checkme === 'open') {
    document.getElementById('contentOpen').value = 'closed';
    document.getElementById('addContent').style.display = 'none';
    document.getElementById('addButton').innerText = 'Show Announcement Maker';
  }
}

function prev10(power) {
  //calculate the modulo?
  // 42 -> 32 ->start at 30 to 40
  var arr = JSON.parse(mysqlres);
  var index = parseInt(document.getElementById('indexe').value);
  //Decrease index and resubmit it here
  index = Math.min(index - 10, (Math.floor(index / 10) * 10) - 10);
  console.log(index);
  document.getElementById('indexe').value = (index);
  var htmlToAdd = '';
  for (let y = 0; y < 10; y++) {
    htmlToAdd += '<div class="row" style="width:100%">';
    htmlToAdd += '<div class="card" style="text-align:center; background-color:tan; padding: 10px">';
    htmlToAdd += '<div class="card-header">';
    htmlToAdd += '<h4>' + arr[y + index].title + '</h4>';
    htmlToAdd += 'ID: <a href="/announcement/' + arr[y + index].id + '">' + arr[y + index].id + '</a><br>';
    htmlToAdd += 'From: ' + arr[y + index].firstName + arr[y + index].lastName + '<br>';
    htmlToAdd += 'Date: ' + new Date(arr[y + index].recency);
    htmlToAdd += '</div>';
    htmlToAdd += '<div>';
    htmlToAdd += '<p class="lead">' + arr[y + index].content + '</p>';
    htmlToAdd += '</div>';
    if (power > 0) {
      htmlToAdd += "<div class='card-footer'>";
      htmlToAdd += '<form action="' + '/announcements/' + arr[y + index].companyID + '" method="POST" style="text-align:right">';
      htmlToAdd += '<input type="hidden" name="contract" value="delAnn">';
      htmlToAdd += '<input type="hidden" name="aid" value="' + arr[y + index].id + '">';
      htmlToAdd += '<button type="submit" class="btn btn-danger">Delete Announcement</button>';
      htmlToAdd += '</form>'
      htmlToAdd += "</div>";
    }
    htmlToAdd += '</div>';
    htmlToAdd += '</div>';
  }
  if (index >= 10) {
    htmlToAdd += "<button onclick='javascript:prev10(" + power + ")'> Previous 10 Announcements </button>"
  }
  htmlToAdd += "<button onclick='javascript:next10(" + power + ")'> Next 10 Announcements </button>"
  document.getElementById('contenee').innerHTML = htmlToAdd;
}

function next10(power) {
  //pull the array and the current index\
  var arr = JSON.parse(mysqlres);
  var index = parseInt(document.getElementById('indexe').value);
  document.getElementById('indexe').value = Math.min(index + 10, arr.length);
  index += 10;
  var htmlToAdd = '';
  for (let y = 0; y < Math.min(10, arr.length - index); y++) {
    htmlToAdd += '<div class="row" style="width:100%">';
    htmlToAdd += '<div class="card" style="text-align:center; background-color:tan; padding: 10px">';
    htmlToAdd += '<div class="card-header">';
    htmlToAdd += '<h4>' + arr[y + index].title + '</h4>';
    htmlToAdd += 'ID: <a href="/announcement/' + arr[y + index].id + '">' + arr[y + index].id + '</a><br>';
    htmlToAdd += 'From: ' + arr[y + index].firstName + arr[y + index].lastName + '<br>';
    htmlToAdd += 'Date: ' + new Date(arr[y + index].recency);
    htmlToAdd += '</div>';
    htmlToAdd += '<div>';
    htmlToAdd += '<p class="lead">' + arr[y + index].content + '</p>';
    htmlToAdd += '</div>';
    if (power > 0) {
      htmlToAdd += "<div class='card-footer'>";
      htmlToAdd += '<form action="' + '/announcements/' + arr[y + index].companyID + '" method="POST" style="text-align:right">';
      htmlToAdd += '<input type="hidden" name="contract" value="delAnn">';
      htmlToAdd += '<input type="hidden" name="aid" value="' + arr[y + index].id + '">';
      htmlToAdd += '<button type="submit" class="btn btn-danger">Delete Announcement</button>';
      htmlToAdd += '</form>'
      htmlToAdd += "</div>";
    }
    htmlToAdd += '</div>';
    htmlToAdd += '</div>';
  }
  htmlToAdd += "<button onclick='javascript:prev10(" + power + ")'> Previous 10 Announcements </button>"
  if (index + 10 < arr.length) {
    htmlToAdd += "<button onclick='javascript:next10(" + power + ")'> Next 10 Announcements </button>"
  }
  document.getElementById('contenee').innerHTML = htmlToAdd;
  // increase index by 10 or remaining difference, whichever is smalelr
  //console.log(document.getElementById('indexe').value);
}
// Employee FUnctions
function closeMenuBox() {
  var l = document.getElementsByClassName("rows");
  for (let y = 0; y < l.length; y++) {
    document.getElementById(l[y].id).style.display = "none";
  }
}

function openChangeTitleBox(emplID, compID, menuBoxID) {
  closeMenuBox();
  // console.log(emplID);
  // console.log(compID);
  // console.log(menuBoxID);
  var lines = '<th scope="col">';
  lines += '<br><form action="/employee/"' + emplID +' method="POST">';
  // lines += '<input type="hidden" name="eid" value="' + emplID + '">';
  lines += '<input type="hidden" name="cid" value="' + compID + '">';
  lines += '<input type="hidden" name="contract" value="changeMyTitle">';
  lines += '<label for="title"> Title: </label>   ';
  lines += '<input type="text"   name="title"  required><br>';
  lines += '<br><button type="submit" class="btn btn-dark">Submit</button>';
  lines += '</form><br>';
  lines += '</th>';
  document.getElementById('menuBox' + menuBoxID).innerHTML = lines;
  document.getElementById('row' + menuBoxID).style.display = "";
}

// <script>
//   $(window).scroll(function() {
//     if($(window).scrollTop() + $(window).height() == $(document).height()) {
//         next10();
//     }
//     });
//   </script>
