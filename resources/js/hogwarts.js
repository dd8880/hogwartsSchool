// Student Object - Data Structure
function Student(id, firstName, nickName, midName, lastName, gender, blood, house,
    photo = 'resources/images/students/default.jpg',
    isExpelled = false, isPrefect = false, isInquisitor = false
) {
    // student object - properties
    this.id = id,
    this.firstName = firstName,
    this.nickName = nickName,
    this.midName = midName,
    this.lastName = lastName,
    this.gender = gender,
    this.blood = blood,
    this.oldBlood = blood,
    this.house = house,
    this.photo = photo,
    this.isExpelled = false,
    this.isPrefect =false,
    this.isInquisitor = false,
    // student object - methods
    // get student status
    this.statusType = () => {
        return this.isExpelled ? 'Expelled' : 'Active';
    };
    // get student roles
    this.roles = () => {
        var r = 'Student';
        if (this.isPrefect) {
            r += ', Prefect';
        }
        if (this.isInquisitor) {
            r += ', Inquisitor';
        }
        if (this.isExpelled) {
            r = 'Before expulsion: ' + r;
        }
        return r;
    };
    // get full name (first + middle + last name)
    this.fullName = () => {
        const fn = this.firstName.trim();
        const mn = this.midName.trim();
        const ln = this.lastName.trim();
        return ((fn + ' ' + mn).trim() + ' ' + ln).trim();
    };
    // get nickname; use '(none)' if not provided
    this.getNickName = () => {
        if (this.nickName) {
            return this.nickName;
        }
        return '(none)';
    };
    // get formatted gender
    this.getGender = () => {
        return this.gender.substring(0, 1).toUpperCase() + this.gender.substring(1);
    };
    // get formatted house
    this.getHouse = () => {
        return this.house.substring(0, 1).toUpperCase() + this.house.substring(1);
    };
    // get formatted blood-type
    this.getBloodType = () => {
        return this.blood.substring(0, 1).toUpperCase() + this.blood.substring(1);
    };
    // get crest based on house
    this.crest = () => {
        return 'resources/images/crest/' + this.house + '.png';
    };
};

// global storage for student list
const StudentList = [];

// global storage for houses
var Houses = [];

// global storage for house members
var HouseMembers = {};

// filters config
const TABLE_FILTER_ELEMENTS = {
    'mnuFilterHouses': 'house',
    'mnuFilterGender': 'gender',
    'mnuFilterBlood': 'blood',
    'mnuFilterRole': 'roles()',
    'mnuFilterStatus': 'statusType()',
};

// table headers config
const TABLE_HEADERS = [
    {
        key: 'firstName',
        label: 'First Name',
        width: '20%',
        sort: 'firstName',
        sortType: 'asc'
    },
    {
        key: 'lastName',
        label: 'Last Name',
        width: '20%',
        sort: 'lastName',
        sortType: 'asc'
    },
    {
        key: 'getGender()',
        label: 'Gender',
        sort: 'gender',
        sortType: 'asc'
    },
    {
        key: 'getHouse()',
        label: 'House',
        sort: 'house',
        sortType: 'asc'
    },
    {
        key: 'getBloodType()',
        label: 'Blood',
        sort: 'blood',
        sortType: 'asc'
    },
    {
        key: 'statusType()',
        label: 'Status',
    },
    {
        key: 'roles()',
        label: 'Roles',
        width: '15%',
    },
    {
        key: '[action]',
        className: 'action-column',
        width: '5%',
    }
];

// global storage for sort config
var GLOBAL_SORT = 'firstName';
var GLOBAL_SORT_TYPE = 'asc';

// split fullname from JSON into first, nick (if any), middle (if any), last name
const parseFullName = (fullName = '') => {
    fullName = fullName.trim();
    if (!fullName.length) {
        return [];
    }
    var fn = '', mn = '', ln = '', nn = '';
    // let's split the fullname via [space]
    const n = fullName.split(' ');
    fn = n[0]; // first name
    // if there are two names, assume the first string as the first name
    // and assume the 2nd as the last name
    if (n.length === 2) {
        // check for middle-lastname formatting (e.g. Finch-Fletchley)
        [mn, ln] = n[1].split('-');
        if (ln === undefined) {
            ln = mn;
            mn = '';
        }
    }
    // if there are three names, assume first, middle, last name
    else if (n.length == 3) {
        [fn, mn, ln] = fullName.split(' ');
        // if middle string is enclosed in double-quotes, assume it's a nickname and not middle name
        if (mn.indexOf('"') !== -1) {
            nn = mn;
            mn = '';
        }
    }
    // proper name formatting
    fn = fn.toLowerCase();
    fn = fn.substring(0, 1).toUpperCase() + fn.substring(1);
    if (nn) {
        nn = nn.replace(/\"/g, '');
        nn = nn.toLowerCase();
        nn = nn.substring(0, 1).toUpperCase() + nn.substring(1);
    } else {
        nn = '';
    }
    if (mn) {
        mn = mn.toLowerCase();
        mn = mn.substring(0, 1).toUpperCase() + mn.substring(1);
    } else {
        mn = '';
    }
    if (ln) {
        ln = ln.toLowerCase();
        ln = ln.substring(0, 1).toUpperCase() + ln.substring(1);
    } else {
        ln = '';
    }
    return {
        firstName: fn,
        nickName: nn,
        midName: mn,
        lastName: ln,
    };
};

// sorting function based on provided property
const compare = (propName, order) => {
    if (order == 'asc') { // ascending order
        return (a, b) => { return a[propName] == b[propName] ? 0 : a[propName] < b[propName] ? -1 : 1; };
    } else { // descending order
        return (b, a) => { return a[propName] == b[propName] ? 0 : a[propName] < b[propName] ? -1 : 1; };
    }
};

// determine blood-type based on last name
const parseBloodType = (families, familyName) => {
    // if family name is in the 'half' grouping, then it's 'half'
    if (families.half.indexOf(familyName) !== -1) {
        return 'half';
    }
    // if family name is in the 'pure' grouping, then it's 'pure'
    if (families.pure.indexOf(familyName) !== -1) {
        return 'pure';
    }
    // default: 'muggle'
    return 'muggle';
};

const totalPopHouses = document.querySelector('.total-population-houses');

// grouping of students based on house members
const getHouseMembers = (houses, studentList) => {
    totalPopHouses.innerHTML = '';
    houses.forEach(house => {
        // group the students by house
        HouseMembers[house] = studentList.filter(student => {
            return student.house == house && !student.isExpelled;
        });
        // display individual house-population
        const formattedHouse = house.substring(0, 1).toUpperCase() + house.substring(1);
        totalPopHouses.innerHTML += formattedHouse + ': ' + HouseMembers[house].length + ';';
    });
};

// set house filter options
const setHouseFilter = (houses) => {
    const houseFilter = document.querySelector('#mnuFilterHouses');
    houses.forEach(house => {
        const optionText = house.substring(0, 1).toUpperCase() + house.substring(1);
        houseFilter.options[houseFilter.options.length] = new Option(optionText, house);
    });
};

// get student photos based on directory of photos
const getStudentPhotos = () => {
    const imagesFolderPath = 'resources/images/students/';
    StudentList.forEach((student, index) => {
        if (student.lastName) {
            // format: lastname_firstLetterOfFirstName all in lowercase
            const filePath1 = imagesFolderPath + student.lastName.toLowerCase() + '_' + student.firstName.substring(0, 1).toLowerCase() + '.png';
            // format: lastname_firstname all in lowercase
            const filePath2 = imagesFolderPath + student.lastName.toLowerCase() + '_' + student.firstName.toLowerCase() + '.png';
            fetch(filePath1).then((response) => {
                return response.blob();
            }).then((blob) => {
                if (blob.type.indexOf('image') !== -1) {
                    StudentList[index].photo = filePath1;
                } else {    
                    fetch(filePath2).then((response) => {
                        return response.blob();
                    }).then((blob) => {
                        if (blob.type.indexOf('image') !== -1) {
                            StudentList[index].photo = filePath2;
                        }
                    });
                }
            });
        }
    });
}

// validate filters
const getValidatedFilters = (filters) => {
    if (!filters) {
        return false;
    }
    // valid filter values per filter
    const validFilters = {
        house: Houses,
        gender: ['boy', 'girl'],
        blood: ['pure', 'half', 'muggle'],
        'roles()': ['prefect', 'inquisitor'],
        'statusType()': ['active', 'expelled'],
    };
    var validatedFilters = {};
    filterKeys = Object.keys(filters);
    filterKeys.forEach(filterKey => {
        // if filter value is valid then add to validated filter list
        if (validFilters[filterKey].indexOf(filters[filterKey]) !== -1) {
            validatedFilters[filterKey] = filters[filterKey];
        }
    });
    return validatedFilters;
}

// global storage for modal DOM elements
const modalBackground = document.querySelector('.modal-background');
const modalViewStudent = document.querySelector('.modal-view-student');

// clear modal for viewing student by setting dummy values
const clearModalViewStudent = () => {
    const dummyStudent = new Student('abc123', 'John', 'John', '', 'Doe', 'boy', 'muggle', 'gryffindor');
    document.querySelector('.student-photo img').setAttribute('src', dummyStudent.photo);
    document.querySelector('.student-fullname > .modal-display-field-value').innerHTML = dummyStudent.fullName();
    document.querySelector('.student-nickname > .modal-display-field-value').innerHTML = dummyStudent.getNickName();
    document.querySelector('.student-gender > .modal-display-field-value').innerHTML = dummyStudent.getGender();
    document.querySelector('.student-house > .modal-display-field-value').innerHTML = dummyStudent.house;
    document.querySelector('.student-blood > .modal-display-field-value').innerHTML = dummyStudent.getBloodType();
    document.querySelector('.student-crest img').setAttribute('src', dummyStudent.crest());
    document.querySelector('.student-roles > .modal-display-field-value').innerHTML = dummyStudent.roles();
    document.querySelector('.student-status > .modal-display-field-value').innerHTML = dummyStudent.statusType();
    // modal action buttons
    document.querySelector('.modal-action-buttons > button#make-prefect').style.display = 'inline-block';
    document.querySelector('.modal-action-buttons > button#revoke-prefect').style.display = 'none';
    document.querySelector('.modal-action-buttons > button#make-inquisitor').style.display = 'inline-block';
    document.querySelector('.modal-action-buttons > button#revoke-inquisitor').style.display = 'none';
    document.querySelector('.modal-action-buttons > button#expel-student').style.display = 'inline-block';
}

// check current student role/s
const checkRole = (student, role) => {
    var message = '';
    // check inquisitor role
    if (role == 'inquisitor') {
        if (student.isInquisitor) {
            message = student.fullName() + ' is already an Inquisitor.';
            return {
                hasRole: true,
                message: message
            };
        }
    }
    // check prefect role
    if (role == 'prefect') {
        if (student.isPrefect) {
            message = student.fullName() + ' is already a Prefect.';
            return {
                hasRole: true,
                message: message
            };
        }
        // check if there's already a student of the same gender that's already been set as prefect of the same house
        // this follows the rule of 1 boy and 1 girl prefect per house
        const memberHouse = HouseMembers[student.house];
        var prefectKid = memberHouse.filter(s => s.isPrefect && s.gender == student.gender);
        var prefectKid = prefectKid.length ? prefectKid[0] : false;
        if (prefectKid && prefectKid.id) {
            message = student.getHouse() + ' already has a ' + student.getGender() + ' Prefect.';
            return {
                hasRole: true,
                message: message
            };
        }
    }
    return { hasRole: false };
};

// set student data into modal to view student info
const viewStudent = (student) => {
    clearModalViewStudent();
    document.querySelector('.student-info > input#student-id').value = student.id;
    document.querySelector('.student-photo img').setAttribute('src', student.photo);
    document.querySelector('.student-fullname > .modal-display-field-value').innerHTML = student.fullName();
    document.querySelector('.student-nickname > .modal-display-field-value').innerHTML = student.getNickName();
    document.querySelector('.student-gender > .modal-display-field-value').innerHTML = student.getGender();
    document.querySelector('.student-house > .modal-display-field-value').innerHTML = student.house;
    document.querySelector('.student-blood > .modal-display-field-value').innerHTML = student.getBloodType();
    document.querySelector('.student-crest img').setAttribute('src', student.crest());
    document.querySelector('.student-roles > .modal-display-field-value').innerHTML = student.roles();
    document.querySelector('.student-status > .modal-display-field-value').innerHTML = student.statusType();
    const prefectRole = checkRole(student, 'prefect');
    // hide Make Prefect button if student is expelled or is already a Prefect
    if (student.isExpelled || prefectRole.hasRole) {
        document.querySelector('.modal-action-buttons > button#make-prefect').style.display = 'none';
    }
    // show Revoke Prefect button if student is active and is a Prefect
    if (!student.isExpelled && prefectRole.hasRole) {
        document.querySelector('.modal-action-buttons > button#revoke-prefect').style.display = 'inline-block';
    }
    const inquisitorRole = checkRole(student, 'inquisitor');
    // hide Make Inquisitor button if student is expelled or is already an Inquisitor
    if (student.isExpelled || inquisitorRole.hasRole) {
        document.querySelector('.modal-action-buttons > button#make-inquisitor').style.display = 'none';
    }
    // show Revoke Inquisitor button if student is active and is an Inquisitor
    if (!student.isExpelled && inquisitorRole.hasRole) {
        document.querySelector('.modal-action-buttons > button#revoke-inquisitor').style.display = 'inline-block';
    }
    // hide Make Expel button if student is already expelled
    if (student.isExpelled) {
        document.querySelector('.modal-action-buttons > button#expel-student').style.display = 'none';
    }
    // set the modal crest theme based on house
    modalViewStudent.className = 'modal-view-student modal-crest-' + student.house;
    // show the modal
    modalBackground.style.display = 'block';
};

// build student list table
const buildStudentListTable = (filters, sortBy = 'firstName', sortType = 'asc', searchKey = '') => {
    // default display: all students
    var filteredStudentList = StudentList;
    // update house members
    getHouseMembers(Houses, StudentList); // get updated house members
    // search
    if (searchKey.length) {
        filteredStudentList = filteredStudentList.filter(s => {
            return s.fullName().toLowerCase().indexOf(searchKey.toLowerCase()) !== -1;
        });
    }

    // filter display: based on set filters
    const validatedFilters = getValidatedFilters(filters);
    if (validatedFilters) {
        const validatedFiltersKeys = Object.keys(validatedFilters);
        validatedFiltersKeys.forEach(key => {
            filteredStudentList = filteredStudentList.filter(student => {
                if (key.indexOf('(') !== -1) {
                    const functName = key.replace(/\(\)/g, '');
                    keyText = student[functName].call();
                    if (functName == 'roles') {
                        return keyText.toLowerCase().indexOf(validatedFilters[key]) !== -1;
                    }
                    return keyText.toLowerCase() == validatedFilters[key];
                } else {
                    return student[key] == validatedFilters[key];
                }
            });
        });
    }

    // sort student list based on current sort settings
    filteredStudentList.sort(compare(sortBy, sortType));

    // display some statistics
    document.querySelector('.currently-shown').innerHTML = filteredStudentList.length;
    document.querySelector('.total-active').innerHTML = StudentList.filter(s => !s.isExpelled).length ?? '0';
    document.querySelector('.total-expelled').innerHTML = StudentList.filter(s => s.isExpelled).length ?? '0';

    // storage for table head
    const tblHeader = document.querySelector('#tblStudentList > thead');
    // if not table headers are not yet set, build table headers
    if (!tblHeader.innerHTML.length) {
        const tblHeaderRow = document.createElement('tr');
        TABLE_HEADERS.forEach((header, headerIndex) => {
            const tblHeaderRowCell = document.createElement('td');
            keyText = header.key == '[action]' ? '' : header.label;
            const tblHeaderRowCellText = document.createTextNode(keyText);
            tblHeaderRowCell.appendChild(tblHeaderRowCellText);
            if (header.className) {
                tblHeaderRowCell.setAttribute('class', header.className);
            }
            if (header.width) {
                tblHeaderRowCell.setAttribute('width', header.width);
            }
            if (header.sort) {
                tblHeaderRowCell.addEventListener('click', () => {
                    GLOBAL_SORT = header.sort;
                    GLOBAL_SORT_TYPE = header.sortType;
                    buildStudentListTable(getAllFilters(), header.sort, header.sortType, searchInput.value);
                    TABLE_HEADERS[headerIndex].sortType = header.sortType == 'asc' ? 'desc' : 'asc';
                }, false);
            }
            tblHeaderRow.appendChild(tblHeaderRowCell);
        });
        tblHeader.appendChild(tblHeaderRow);
    }
    // storage for table body
    const tblBody = document.querySelector('#tblStudentList > tbody');
    // default table body content or when there is no result based on filters selected
    tblBody.innerHTML = '<tr><td colspan="' + TABLE_HEADERS.length + '" style="text-align: center;">No result.</td></tr>';
    // build the table rows
    if (filteredStudentList.length) {
        // clear table body
        tblBody.innerHTML = '';
        // for each student, set the row data based on table header config
        filteredStudentList.forEach(student => {
            const tblBodyRow = document.createElement('tr');
            TABLE_HEADERS.forEach(header => {
                const tblBodyRowCell = document.createElement('td');
                // set the [action] column
                if (header.key == '[action]') {
                    const viewButton = document.createElement('img');
                    viewButton.setAttribute('src', 'resources/images/eye.png');
                    viewButton.setAttribute('id', 'view-info');
                    viewButton.addEventListener('click', () => { viewStudent(student) }, false);
                    tblBodyRowCell.appendChild(viewButton);
                } else { // set the table data
                    // this is a student.property
                    var keyText = student[header.key];
                    // this is a student.method()
                    if (header.key.indexOf('(') !== -1) {
                        const functName = header.key.replace(/\(\)/g, '');
                        // call the student.method()
                        keyText = student[functName].call();
                    }
                    // when system is hacked - blood-type ransack
                    if (header.key == 'getBloodType()' && SYSTEM_HACKED && student.id != unexpellableId) {
                        // if the student is pure-blooded, randomly change the blood type
                        if (student.oldBlood == 'pure') {
                            const bloodType = ['muggle', 'half'];
                            keyText = bloodType[Math.floor(Math.random() * bloodType.length)];
                        }
                        // if the student is not pure-blooded, make him pure
                        if (student.oldBlood != 'pure' && student.blood != 'pure' && student.id != unexpellableId) {
                            keyText = 'pure';
                        }
                        const studentIndex = StudentList.findIndex(s => s.id == student.id);
                        StudentList[studentIndex].blood = keyText;
                        keyText = keyText.substring(0, 1).toUpperCase() + keyText.substring(1);
                    }
                    const tblBodyRowCellText = document.createTextNode(keyText);
                    tblBodyRowCell.appendChild(tblBodyRowCellText);
                }
                if (header.className) {
                    tblBodyRowCell.setAttribute('class', header.className);
                }
                if (header.width) {
                    tblBodyRowCell.setAttribute('width', header.width);
                }
                tblBodyRow.appendChild(tblBodyRowCell);
            });
            tblBody.appendChild(tblBodyRow);
        });
    }
};

// parse student data based on fetched student list
const parseStudentData = (studentList) => {
    if (!studentList) {
        return false;
    }
    // display total population
    document.querySelector('.total-population').innerHTML = StudentList.length;
    // fetch families
    fetch(
        'https://petlatkea.dk/2021/hogwarts/families.json'
    ). then((response) => {
        return response.json();
    }).then((families) => {
        // format family names to proper case
        families.pure = families.pure.map(p => {
            p = p.toLowerCase()
            return p.substring(0, 1).toUpperCase() + p.substring(1);
        });
        families.half = families.half.map(h => {
            h = h.toLowerCase()
            return h.substring(0, 1).toUpperCase() + h.substring(1);
        });
        // foreach fetched student data, instantiate a Student object and push to global student list
        studentList.forEach(student => {
            const fullname = parseFullName(student.fullname);
            const id = btoa(student.fullname.toLowerCase().trim());
            const firstName = fullname.firstName;
            const nickName = fullname.nickName;
            const midName = fullname.midName;
            const lastName = fullname.lastName;
            const gender = student.gender.toLowerCase();
            const blood = parseBloodType(families, fullname.lastName);
            const house = student.house.toLowerCase().trim();
            // add parsed student data to list of students
            StudentList.push(new Student(id, firstName, nickName, midName, lastName, gender, blood, house));
        });
        // get photos
        getStudentPhotos();
        // determine houses
        Houses = [...new Set(StudentList.map(student => student.house))].sort();
        // group students by house
        getHouseMembers(Houses, StudentList);
        // set house filter menu options
        setHouseFilter(Houses);
        // display student list
        buildStudentListTable();
    });
};

// get student list
const getStudents = () => {
    // fetch student list
    fetch(
        'https://petlatkea.dk/2021/hogwarts/students.json'
    ).then((response) => {
        return response.json();
    }).then((data) => {
        buildStudentListTable();
        // parse student data
        parseStudentData(data);
    });
};

// get all currently set filters
const getAllFilters = () => {
    const filterElementIds = Object.keys(TABLE_FILTER_ELEMENTS);
    var filters = {};
    filterElementIds.forEach(filterElementOjbId => {
        const el = document.querySelector('#' + filterElementOjbId);
        if (el.value.indexOf('--all--') === -1) {
            filters[TABLE_FILTER_ELEMENTS[filterElementOjbId]] = el.value;
        }
    });
    return filters;
}

// handler when a filter menu changes
const filterStudentList = (filterElement) => {
    const filterElementId = filterElement.getAttribute('id');
    const filterElementIds = Object.keys(TABLE_FILTER_ELEMENTS);
    // if not a valid filter, don't do anything
    if (filterElementIds.indexOf(filterElementId) === -1) {
        return;
    }
    // set filter based on selected filter
    var filters = {
        [TABLE_FILTER_ELEMENTS[filterElementId]]: filterElement.value
    };
    // get all other currently set filters
    filterElementIds.forEach(filterElementOjbId => {
        if (filterElementOjbId != filterElementId) {
            const el = document.querySelector('#' + filterElementOjbId);
            // if the filter menu is not '--all--', add to filters
            if (el.value.indexOf('--all--') === -1) {
                filters[TABLE_FILTER_ELEMENTS[filterElementOjbId]] = el.value;
            }
        }
    });
    // display student list based on currently set filters
    buildStudentListTable(filters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
};

// global storage for search input field
const searchInput = document.querySelector('#search-student');

// keypress event-listener handler for search input field
searchInput.addEventListener('keyup', () => {
    buildStudentListTable(getAllFilters(), GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
});

// system hacking - remove inquisitor role after 5 seconds
const removeInquisitorRole = (student) => {
    console.log('Inquisitor detected...');
    setTimeout(
        () => {
            const studentIndex = StudentList.findIndex(s => s.id == student.id);
            StudentList[studentIndex].isInquisitor = false;
            alert(student.fullName() + '\'s Inquisitor role has been stripped off.');
            buildStudentListTable(getAllFilters(), GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
            viewStudent(StudentList[studentIndex]);
        }
    , 5000);
};

// global storage for modal close button
const modalCloseButton = document.querySelector('.modal-close-button');

// click event-listener handler for modal close button
modalCloseButton.addEventListener('click', () => {
    clearModalViewStudent();
    modalBackground.style.display = 'none';
}, false);

// global storage for Make Prefect button
const prefectButton = document.querySelector('.modal-action-buttons > button#make-prefect');

// click event-listener handler for Make Prefect button
prefectButton.addEventListener('click', () => {
    const studentId = document.querySelector('.student-info > input#student-id').value;
    var student = StudentList.filter(s => s.id == studentId);
    student = student.length ? student[0] : false;
    if (student && student.id) {
        const prefectRole = checkRole(student, 'prefect');
        if (prefectRole.hasRole) {
            alert(prefectRole.message);
            return;
        }
        // get the index location of the student in the StudentList
        const studentIndex = StudentList.findIndex(s => s.id == student.id);
        // update isPrefect to true
        StudentList[studentIndex].isPrefect = true;
        alert(student.fullName() + ' is now a Prefect!');
        // reload modal
        viewStudent(student);
        // hide Make Prefect button
        prefectButton.style.display = 'none';
        // show Revoke Prefect button
        revokePrefectButton.style.display = 'inline-block';
        // reload student list table
        const currentFilters = getAllFilters();
        buildStudentListTable(currentFilters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        return;
    }
    alert('Student not found!');
}, false);

// global storage for Revoke Prefect-role button
const revokePrefectButton = document.querySelector('.modal-action-buttons > button#revoke-prefect');

// click event-listener handler for Revoke Prefect-role button
revokePrefectButton.addEventListener('click', () => {
    const studentId = document.querySelector('.student-info > input#student-id').value;
    var student = StudentList.filter(s => s.id == studentId);
    student = student.length ? student[0] : false;
    if (student && student.id) {
        const prefectRole = checkRole(student, 'prefect');
        if (prefectRole.hasRole) {
            const studentIndex = StudentList.findIndex(s => s.id == student.id);
            StudentList[studentIndex].isPrefect = false;
            alert(student.fullName() + ' has been revoked its Prefect role!');
            viewStudent(student);
            revokePrefectButton.style.display = 'none';
            prefectButton.style.display = 'inline-block';
            const currentFilters = getAllFilters();
            buildStudentListTable(currentFilters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        }
        alert(student.fullName() + ' is not a Prefect!');
        return;
    }
    alert('Student not found!');
}, false);

// global storage for Make Inquisitor button
const inquisitorButton = document.querySelector('.modal-action-buttons > button#make-inquisitor');

// click event-listener handler for Make Inquisitor button
inquisitorButton.addEventListener('click', () => {
    const studentId = document.querySelector('.student-info > input#student-id').value;
    var student = StudentList.filter(s => s.id == studentId);
    student = student.length ? student[0] : false;
    if (student && student.id) {
        const inquisitorRole = checkRole(student, 'inquisitor');
        if (inquisitorRole.hasRole) {
            alert(inquisitorRole.message);
            return;
        }
        if (student.house != 'slytherin') {
            alert('Only students from the Slytherin house are allowed to be an inquisitor!');
            return;
        }
        const studentIndex = StudentList.findIndex(s => s.id == student.id);
        StudentList[studentIndex].isInquisitor = true;
        alert(student.fullName() + ' is now an Inquisitor!');
        viewStudent(student);
        inquisitorButton.style.display = 'none';
        revokeInquisitorButton.style.display = 'inline-block';
        const currentFilters = getAllFilters();
        buildStudentListTable(currentFilters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        if (SYSTEM_HACKED) {
            removeInquisitorRole(student);
        }
        return;
    }
    alert('Student not found!');
}, false);

// global storage for Revoke Inquisitor button
const revokeInquisitorButton = document.querySelector('.modal-action-buttons > button#revoke-inquisitor');

// click event-listener handler for Make Inquisitor button
revokeInquisitorButton.addEventListener('click', () => {
    const studentId = document.querySelector('.student-info > input#student-id').value;
    var student = StudentList.filter(s => s.id == studentId);
    student = student.length ? student[0] : false;
    if (student && student.id) {
        const inquisitorRole = checkRole(student, 'inquisitor');
        if (!inquisitorRole.hasRole) {
            alert(student.fullName() + ' is not an Inquisitor.');
            return;
        }
        const studentIndex = StudentList.findIndex(s => s.id == student.id);
        StudentList[studentIndex].isInquisitor = false;
        alert(student.fullName() + ' is now removed an Inquisitor!');
        viewStudent(student);
        revokeInquisitorButton.style.display = 'none';
        inquisitorButton.style.display = 'inline-block';
        const currentFilters = getAllFilters();
        buildStudentListTable(currentFilters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        return;
    }
    alert('Student not found!');
}, false);

// global storage for Expel button
const expelButton = document.querySelector('.modal-action-buttons > button#expel-student');

// click event-listener handler for Expel button
expelButton.addEventListener('click', () => {
    const studentId = document.querySelector('.student-info > input#student-id').value;
    var student = StudentList.filter(s => s.id == studentId);
    student = student.length ? student[0] : false;
    if (student && student.id) {
        if (student.id == unexpellableId) {
            alert(student.fullName() + ' is UNEXPELLABLE! Please see the Headmaster about this.');
            return;
        }
        if (student.isExpelled) {
            alert(student.fullName() + ' is already expelled!');
            return;
        }
        var conf = confirm('Are you sure you want to expel ' + student.fullName() + '?');
        if (conf) {
            const studentIndex = StudentList.findIndex(s => s.id == student.id);
            StudentList[studentIndex].isExpelled = true;
            alert(student.fullName() + ' is now expelled from Hogwarts!');
            viewStudent(student);
            expelButton.style.display = 'none';
            prefectButton.style.display = 'none';
            inquisitorButton.style.display = 'none';
            const currentFilters = getAllFilters();
            buildStudentListTable(currentFilters, GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        }
        return;
    }
    alert('Student not found!');
}, false);

// the unexpellable ID
const unexpellableId = btoa('Diana Winther');

// global storage to track when system hacking has been triggered
var SYSTEM_HACKED = false;

// hack-the-system function; you may call this function via browser console
const hackTheSystem = () => {
    console.log('Hacking in-progress...');
    if (!SYSTEM_HACKED) {
        // toggle system-hacked tracker
        SYSTEM_HACKED = true;
        // add yourself to the global student list
        const studentIndex = StudentList.findIndex(s => s.id == unexpellableId);
        if (studentIndex === -1) {
            StudentList.push(new Student(unexpellableId, 'Diana', 'Diana', 'D', 'Winther', 'girl', 'pure', 'gryffindor', 'resources/images/students/winther_d.jpg'));
        }
        // reload student list (based on current filters and sort status)
        buildStudentListTable(getAllFilters(), GLOBAL_SORT, GLOBAL_SORT_TYPE, searchInput.value);
        console.log('Hacking attempt successful.');
    } else {
        console.log('System is already hacked.');
    }
};

// CTRL + Shift + h will trigger hacking
document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && e.shiftKey && e.key == "H") {
        hackTheSystem();
    }
});
