(function () {
    var concurrentUpdate = angular.module('concurrentUpdate', []);

    concurrentUpdate.run(function ($rootScope) {
        $rootScope["concurrentUpdateWsCon"] = new WebSocket('ws://127.0.0.1:1337');
    });

    var EditPatientController = function ($scope) {
        $scope.isDisableControls = true;
        $scope.selectedProvider = "0";
        $scope.selectedUser = "0";
        $scope.selectedPatient = "0";

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
                name: "Maria Preethi"
            },
            {
                providerId: 1001,
                userId: 100102,
                name: "Sucheta Shukla"
            },
            {
                providerId: 1001,
                userId: 100103,
                name: "Subhash Walunj"
            },
            {
                providerId: 1002,
                userId: 100201,
                name: "Naveen Joonala"
            },
            {
                providerId: 1002,
                userId: 100202,
                name: "Rishi Walwalkar"
            },
            {
                providerId: 1002,
                userId: 100203,
                name: "Gautam Kochar"
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

        $scope.setIsDisableControls = function () {
            $scope.selectedUser = "0";
            $scope.selectedPatient = "0";
            $scope.editPatient = {
                name: "",
                lname: "",
                contact: "",
                gender: ""
            }
            $scope.isDisableControls = ($scope.selectedProvider == "0") ? true : false;
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
    }
    EditPatientController.$inject = ['$scope'];
    concurrentUpdate.controller('EditPatientController', EditPatientController);

    var syncConcurrentUpdate = function ($rootScope, $sce) {
        return {
            require: "form",
            link: function (scope, element, attrs) {
                scope.alertClass = "alert-info";
                window.WebSocket = window.WebSocket || window.MozWebSocket;
                // if browser doesn't support WebSocket, just show some notification and exit
                if (!window.WebSocket) {
                    scope.alertClass = "alert-warning";
                    scope.alertMsg = $sce.trustAsHtml("Sorry, but your browser doesn support WebSockets. We cannot assist you in concurrent form updation.");
                } else {
                    $rootScope.concurrentUpdateWsCon.onopen = function () {
                        scope.alertClass = "alert-success";
                        scope.alertMsg = $sce.trustAsHtml("Ready to roll with WebSocket!");
                        scope.$apply();
                    };

                    $rootScope.concurrentUpdateWsCon.onerror = function (error) {
                        scope.alertClass = "alert-warning";
                        scope.alertMsg = $sce.trustAsHtml("Sorry, but there's some problem with your connection or the server is down. We cannot assist you in concurrent form updation.");
                        scope.$apply();
                    };

                    element.on("change", function () {
                        $rootScope.concurrentUpdateWsCon.send(JSON.stringify({"fname":"Subhash","lname":"Walunj"}));
                    });
                }
            }
        }
    }
    syncConcurrentUpdate.$inject = ['$rootScope', '$sce'];
    concurrentUpdate.directive('syncConcurrentUpdate', syncConcurrentUpdate);
})();