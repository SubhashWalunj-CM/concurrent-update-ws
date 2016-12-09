(function () {
    var concurrentUpdate = angular.module('concurrentUpdate', []);

    concurrentUpdate.value('webSocketConstants', {
        webSocketUrl: 'ws://127.0.0.1:1337',
        concurrentUpdateWsCon: {}
    });
    /*concurrentUpdate.run(function ($rootScope) {
        $rootScope["concurrentUpdateWsCon"] = new WebSocket('ws://127.0.0.1:1337');
    });*/

    var EditPatientController = function ($scope) {
        $scope.isProviderSelected = false;
        $scope.selectedProvider = "0";
        $scope.selectedUser = "0";
        $scope.selectedPatient = "0";
        $scope.enableControls = false;

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

    var syncConcurrentUpdateDirective = function ($rootScope, $sce, webSocketConstants) {
        return {
            require: "form",
            link: function (scope, element, attrs) {
                scope.$watch('enableControls', function (newValue, oldValue) {
                    if (newValue) {
                        var formFieldData = {
                            "firstName": "John",
                            "lastName": "Doe",
                            "contactNo": "",
                            "gender": "M"
                        };
                        var reqJson = {
                            "providerId": scope.selectedProvider,
                            "patientId": scope.selectedPatient,
                            "formId": attrs.id,
                            "userId": scope.selectedUser,
                            "fields": formFieldData
                        };
                        scope.alertClass = "alert-info";

                        if (angular.equals(webSocketConstants.concurrentUpdateWsCon, {})) {
                            webSocketConstants.concurrentUpdateWsCon = new WebSocket(webSocketConstants.webSocketUrl);
                        }

                        window.WebSocket = window.WebSocket || window.MozWebSocket;
                        // if browser doesn't support WebSocket, just show some notification and exit
                        if (!window.WebSocket) {
                            scope.alertClass = "alert-warning";
                            scope.alertMsg = $sce.trustAsHtml("Sorry, but your browser doesn support WebSockets. We cannot assist you in concurrent form updation.");
                        } else {
                            webSocketConstants.concurrentUpdateWsCon.onopen = function () {
                                scope.alertClass = "alert-success";
                                scope.alertMsg = $sce.trustAsHtml("Ready to roll with WebSocket!");
                                scope.$apply();
                                webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
                            };

                            webSocketConstants.concurrentUpdateWsCon.onerror = function (error) {
                                scope.alertClass = "alert-warning";
                                scope.alertMsg = $sce.trustAsHtml("Sorry, but there's some problem with your connection or the server is down. We cannot assist you in concurrent form updation.");
                                scope.$apply();
                            };

                            element.on("change", function () {
                                webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
                            });
                        }
                    }
                });
            }
        }
    }
    syncConcurrentUpdateDirective.$inject = ['$rootScope', '$sce', 'webSocketConstants'];
    concurrentUpdate.directive('syncConcurrentUpdateDirective', syncConcurrentUpdateDirective);
})();