(function () {
    var concurrentUpdate = angular.module('concurrentUpdate', ['wsConcurrentFormUpdate']);

    var EditPatientController = function ($scope) {
        $scope.isProviderSelected = false;
        $scope.selectedProvider = "0";
        $scope.selectedUser = "0";
        $scope.selectedPatient = "0";
        $scope.enableControls = false;
        $scope.dynamicPopover = {};

        $scope.providers = [
            {
                id: 1001,
                name: "Jackson Healthcare"
            },
            {
                id: 1002,
                name: "Madison Healthcare"
            }
        ];

        $scope.users = [
            {
                providerId: 1001,
                userId: 100101,
                name: "Stephen"
            },
            {
                providerId: 1001,
                userId: 100102,
                name: "Joe"
            },
            {
                providerId: 1001,
                userId: 100103,
                name: "Eric"
            },
            {
                providerId: 1001,
                userId: 100104,
                name: "Troy"
            },
            {
                providerId: 1002,
                userId: 100201,
                name: "Dexter"
            },
            {
                providerId: 1002,
                userId: 100202,
                name: "Ryan"
            },
            {
                providerId: 1002,
                userId: 100203,
                name: "Justin"
            }
        ];

        $scope.patients = [
            {
                providerId: 1001,
                patientId: 1001001,
                fname: "Steven",
                lname: "Smith",
                contact: "+15266325412",
                gender: "M"
            },
            {
                providerId: 1001,
                patientId: 1001002,
                fname: "Jimmy",
                lname: "Watson",
                contact: "+15448266329",
                gender: "F"
            },
            {
                providerId: 1002,
                patientId: 1002001,
                fname: "David",
                lname: "Warnor",
                contact: "+15448441253",
                gender: "M"
            },
            {
                providerId: 1002,
                patientId: 1002002,
                fname: "Sandy",
                lname: "Maxwell",
                contact: "+15448412257",
                gender: "F"
            }
        ];

        $scope.editPatient = {
            name: "",
            lname: "",
            contact: "",
            gender: ""
        }

        $scope.setIsProviderSelected = function () {
            $scope.selectedUser = "0";
            $scope.selectedPatient = "0";
            $scope.editPatient = {
                name: "",
                lname: "",
                contact: "",
                gender: ""
            }
            $scope.isProviderSelected = ($scope.selectedProvider == "0") ? false : true;
        }

        $scope.setEditPatient = function () {
            if ($scope.selectedPatient != "0") {
                angular.forEach($scope.patients, function (value, key) {
                    if (value.patientId == $scope.selectedPatient) {
                        $scope.editPatient = angular.copy(value);
                        return;
                    }
                });
            }
        }

        $scope.setEnableControls = function () {
            $scope.enableControls = ($scope.selectedProvider == "0" || $scope.selectedUser == "0" || $scope.selectedPatient == "0") ? false : true;
        }
    }
    EditPatientController.$inject = ['$scope'];
    concurrentUpdate.controller('EditPatientController', EditPatientController);
})();