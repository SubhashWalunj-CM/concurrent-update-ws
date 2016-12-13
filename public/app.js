(function () {
    var concurrentUpdate = angular.module('concurrentUpdate', ['ui.bootstrap']);

    concurrentUpdate.value('webSocketConstants', {
        webSocketUrl: 'ws://127.0.0.1:1337',
        concurrentUpdateWsCon: {}
    });

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
                providerId: 1001,
                userId: 100104,
                name: "Will Smith"
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
        function formatArrayJoin(arr, separator, lastSeparator) {
            var outStr = "";
            if (arr.length === 1) {
                outStr = arr[0];
            } else if (arr.length === 2) {
                outStr = arr.join(' ' + lastSeparator + ' ');
            } else if (arr.length > 2) {
                outStr = arr.slice(0, -1).join(separator + ' ') + ' ' + lastSeparator + ' ' + arr.slice(-1);
            }
            return outStr;
        }

        return {
            require: "form",
            link: function (scope, element, attrs) {
                scope.dynamicPopover = {};
                scope.dynamicPopover[attrs.name] = {};
                scope.$watch('enableControls', function (newValue, oldValue) {
                    if (newValue) {
                        var formFieldData = {};
                        var dirtyFormControls = [];
                        var form = scope[attrs.name];
                        angular.forEach(form, function (value, key) {
                            if (typeof value === 'object' && value.hasOwnProperty('$modelValue')) {
                                formFieldData[value.$name] = value.$modelValue;
                                dirtyFormControls.push(value);
                            }
                        });

                        var reqJson = {
                            "providerId": scope.selectedProvider,
                            "patientId": scope.selectedPatient,
                            "formId": attrs.id,
                            "userId": scope.selectedUser
                        };
                        scope.alertClass = "alert-info";

                        if (angular.equals(webSocketConstants.concurrentUpdateWsCon, {})) {
                            webSocketConstants.concurrentUpdateWsCon = new WebSocket(webSocketConstants.webSocketUrl);
                        }

                        window.WebSocket = window.WebSocket || window.MozWebSocket;
                        if (!window.WebSocket) {
                            scope.alertClass = "alert-warning";
                            scope.alertMsg = $sce.trustAsHtml("Sorry, but your browser doesn support WebSockets. We cannot assist you in concurrent form updation.");
                        } else {
                            function triggerFormChangeReq(form, formFieldData, reqJson) {
                                angular.forEach(form, function (value, key) {
                                    if (typeof value === 'object' && value.hasOwnProperty('$modelValue')) {
                                        formFieldData[value.$name] = value.$modelValue;
                                    }
                                });
                                reqJson["type"] = "FORM-CHANGE-REQ";
                                reqJson["fields"] = formFieldData;
                                webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
                            }

                            webSocketConstants.concurrentUpdateWsCon.onopen = function () {
                                reqJson["type"] = "REGISTER-CONNECTION-REQ";
                                webSocketConstants.concurrentUpdateWsCon.send(JSON.stringify(reqJson));
                            };

                            webSocketConstants.concurrentUpdateWsCon.onerror = function (error) {
                                scope.alertClass = "alert-warning";
                                scope.alertMsg = $sce.trustAsHtml("Sorry, but there's some problem with your connection or the server is down. We cannot assist you in concurrent form updation.");
                                scope.$apply();
                            };

                            webSocketConstants.concurrentUpdateWsCon.onmessage = function (message) {
                                if ('data' in message) {
                                    var resp = JSON.parse(message.data);

                                    switch (resp.type) {
                                    case "WORKING-USER-RESP":
                                        var workingUserNameArr = [];
                                        if ("workingUsers" in resp && Array.isArray(resp.workingUsers)) {
                                            var index = resp.workingUsers.indexOf(scope.selectedUser);
                                            if (index > -1) {
                                                resp.workingUsers.splice(index, 1);
                                            }

                                            angular.forEach(scope.users, function (value, key) {
                                                for (var i = 0; i < resp.workingUsers.length; i++) {
                                                    if (resp.workingUsers[i] == value.userId) {
                                                        workingUserNameArr.push(value.name);
                                                    }
                                                }
                                            });

                                            if (workingUserNameArr.length) {
                                                scope.alertClass = "alert-info";
                                                scope.alertMsg = $sce.trustAsHtml("<strong>" + formatArrayJoin(angular.copy(workingUserNameArr), ',', 'and') + "</strong> is working on this form.");
                                                scope.$apply();

                                                triggerFormChangeReq(form, formFieldData, reqJson);
                                            }
                                        }
                                        break;
                                    case "FORM-CHANGE-RESP":
                                        if (scope.selectedUser in resp) {
                                            delete resp[scope.selectedUser];
                                        }

                                        //if (typeof userFormData === 'object' && "fields" in userFormData) {
                                        angular.forEach(dirtyFormControls, function (control, controlKey) {
                                            var str = "";
                                            //scope.dynamicPopover[attrs.name][control.$name] = "";
                                            angular.forEach(resp, function (userFormData, userFormKey) {
                                                angular.forEach(userFormData.fields, function (userFormFieldValue, userFormFieldKey) {
                                                    //scope.dynamicPopover[attrs.name][userFormFieldKey] = "";
                                                    if (control.$name == userFormFieldKey) {
                                                        var userName = "";
                                                        angular.forEach(scope.users, function (value, key) {
                                                            if (userFormKey == value.userId) {
                                                                userName = value.name;
                                                            }
                                                        });
                                                        str += "<strong>" + userName + ":</strong> " + userFormFieldValue + "<br>";
                                                    }
                                                });
                                            });
                                            scope.dynamicPopover[attrs.name][control.$name] = $sce.trustAsHtml(str);
                                            scope.$apply();
                                        });
                                        /*angular.forEach(userFormData.fields, function (userFormFieldValue, userFormFieldKey) {
                                            //scope.dynamicPopover[attrs.name][userFormFieldKey] = "";
                                            angular.forEach(dirtyFormControls, function (value, key) {
                                                if (value.$name == userFormFieldKey) {
                                                    var userName = "";
                                                    angular.forEach(scope.users, function (value, key) {
                                                        if (userFormKey == value.userId) {
                                                            userName = value.name;
                                                        }
                                                    });
                                                    scope.dynamicPopover[attrs.name][userFormFieldKey] += userName + ": " + userFormFieldValue +"\n";
                                                    scope.$apply();
                                                }
                                            });
                                        });*/
                                        //}
                                        //});
                                        break;
                                    default:
                                        console.log("No matching resp type...");
                                    }
                                }
                            }

                            element.on("change keyup", function () {
                                triggerFormChangeReq(form, formFieldData, reqJson);
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