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
