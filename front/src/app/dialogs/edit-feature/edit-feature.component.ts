import {
  Component,
  OnInit,
  Inject,
  ViewChild,
  ChangeDetectionStrategy,
  HostListener,
  OnDestroy,
  ChangeDetectorRef,
  Renderer2,
  ɵɵtrustConstantResourceUrl,
  ViewChildren,
  QueryList
} from '@angular/core';
import { ApiService } from '@services/api.service';
import { FileUploadService } from '@services/file-upload.service';
import { InputFocusService } from '../../services/inputFocus.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { API_URL } from 'app/tokens';
import {
  MatLegacyDialogRef as MatDialogRef,
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialog as MatDialog,
  MatLegacyDialogModule,
} from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  UntypedFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatLegacyCheckboxChange as MatCheckboxChange,
  MatLegacyCheckboxModule,
} from '@angular/material/legacy-checkbox';
import { StepEditorComponent } from '@components/step-editor/step-editor.component';
import { BrowserSelectionComponent } from '@components/browser-selection/browser-selection.component';
import { AddStepComponent } from '@dialogs/add-step/add-step.component';
import {
  MatLegacyChipListChange as MatChipListChange,
  MatLegacyChipsModule,
} from '@angular/material/legacy-chips';
import { ApplicationsState } from '@store/applications.state';
import { Select, Store } from '@ngxs/store';
import { EnvironmentsState } from '@store/environments.state';
import { ConfigState } from '@store/config.state';
import { UserState } from '@store/user.state';
import { EditVariablesComponent } from '@dialogs/edit-variables/edit-variables.component';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';
import { FeatureCreated } from '@dialogs/edit-feature/feature-created/feature-created.component';
import { ScheduleHelp } from '@dialogs/edit-feature/schedule-help/schedule-help.component';
import { MobileListComponent } from '@dialogs/mobile-list/mobile-list.component';
import { EmailTemplateHelp } from './email-template-help/email-template-help.component';
import { KEY_CODES } from '@others/enums';
import { CustomSelectors } from '@others/custom-selectors';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { noWhitespaceValidator, deepClone } from 'ngx-amvara-toolbox';
import { StepDefinitions } from '@store/actions/step_definitions.actions';
import { Features } from '@store/actions/features.actions';
import { FeaturesState } from '@store/features.state';
import { ActionsState } from '@store/actions.state';
import { finalize, switchMap } from 'rxjs/operators';
import {
  AreYouSureData,
  AreYouSureDialog,
} from '@dialogs/are-you-sure/are-you-sure.component';
import { Configuration } from '@store/actions/config.actions';
import { parseExpression } from 'cron-parser';
import { DepartmentsState } from '@store/departments.state';
import { VariablesState } from '@store/variables.state';
import { TranslateModule } from '@ngx-translate/core';
import { HumanizeBytesPipe } from '@pipes/humanize-bytes.pipe';
import { SortByPipe } from '@pipes/sort-by.pipe';
import { AmDateFormatPipe } from '@pipes/am-date-format.pipe';
import { AmParsePipe } from '@pipes/am-parse.pipe';
import { DisableAutocompleteDirective } from '../../directives/disable-autocomplete.directive';
import { StepEditorComponent as StepEditorComponent_1 } from '../../components/step-editor/step-editor.component';
import { EditSchedule } from '@dialogs/edit-schedule/edit-schedule.component';
import { RouterLink } from '@angular/router';
import { BrowserSelectionComponent as BrowserSelectionComponent_1 } from '../../components/browser-selection/browser-selection.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatLegacyMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyTableModule } from '@angular/material/legacy-table';
import { StopPropagationDirective } from '../../directives/stop-propagation.directive';
import { MatLegacyRadioModule } from '@angular/material/legacy-radio';
import { MatLegacyButtonModule } from '@angular/material/legacy-button';
import { LetDirective } from '../../directives/ng-let.directive';
import { MatLegacyTooltipModule } from '@angular/material/legacy-tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule } from '@angular/material/legacy-input';
import { MatLegacyOptionModule } from '@angular/material/legacy-core';
import { MatLegacySelectModule } from '@angular/material/legacy-select';
import { MatLegacyFormFieldModule } from '@angular/material/legacy-form-field';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { DraggableWindowModule } from '@modules/draggable-window.module';
import { LogService } from '@services/log.service';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


@Component({
  selector: 'edit-feature',
  templateUrl: './edit-feature.component.html',
  styleUrls: ['./edit-feature.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    MatLegacyDialogModule,
    MatExpansionModule,
    MatLegacyFormFieldModule,
    MatLegacySelectModule,
    NgFor,
    MatLegacyOptionModule,
    MatLegacyInputModule,
    MatIconModule,
    MatLegacyCheckboxModule,
    MatLegacyTooltipModule,
    LetDirective,
    MatLegacyButtonModule,
    MatLegacyChipsModule,
    MatLegacyRadioModule,
    StopPropagationDirective,
    MatLegacyTableModule,
    MatLegacyProgressSpinnerModule,
    MatLegacyMenuModule,
    ClipboardModule,
    BrowserSelectionComponent_1,
    RouterLink,
    StepEditorComponent_1,
    DisableAutocompleteDirective,
    AsyncPipe,
    AmParsePipe,
    AmDateFormatPipe,
    SortByPipe,
    HumanizeBytesPipe,
    TranslateModule,
    DraggableWindowModule,
    MobileListComponent
  ],
})
export class EditFeature implements OnInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'mime',
    'size',
    'uploaded_by.name',
    'created_on',
    'actions',
  ];
  // Get all expansion panels
  @ViewChildren(MatExpansionPanel) expansionPanels!: QueryList<MatExpansionPanel>;

  @ViewSelectSnapshot(ConfigState) config$!: Config;
  /**
   * These values are now filled in the constructor as they need to initialize before the view
   */
  // @ViewSelectSnapshot(ApplicationsState) applications$ !: Application[];
  // @ViewSelectSnapshot(EnvironmentsState) environments$ !: Environment[];
  // @ViewSelectSnapshot(UserState.RetrieveUserDepartments) departments$ !: Department[];
  applications$!: Application[];
  environments$!: Environment[];
  departments$!: Department[];
  @ViewSelectSnapshot(UserState) user!: UserInfo;
  @ViewSelectSnapshot(UserState.HasOneActiveSubscription)
  hasSubscription: boolean;
  @Select(DepartmentsState) allDepartments$: Observable<Department[]>;
  @Select(VariablesState) variableState$: Observable<VariablePair[]>;

  saving$ = new BehaviorSubject<boolean>(false);

  departmentSettings$: Observable<Department['settings']>;
  variable_dialog_isActive: boolean = false;

  steps$: Observable<FeatureStep[]>;

  // next runs an array of next executions
  nextRuns = [];
  // parse error
  parseError = {
    error: false,
    msg: '',
  };
  // get user timezone
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  browserstackBrowsers = new BehaviorSubject<BrowserstackBrowser[]>([]);

  // List of default values to be displayed on the feature information selectors
  selected_department;
  selected_application;
  selected_environment;
  department;
  variables!: VariablePair[];

  readonly separatorKeysCodes: number[] = [ENTER, COMMA];


  @ViewChild(StepEditorComponent, { static: false })
  stepEditor: StepEditorComponent;

  @ViewChild(EditSchedule, { static: false })
  EditSch: EditSchedule;

  inputFocus: boolean = false;

  private inputFocusSubscription: Subscription;

  isExpanded: boolean = false;

  // COTEMP -- Used to check the state data status
  @Select(FeaturesState.GetStateDAta) state$: Observable<
    ReturnType<typeof FeaturesState.GetStateDAta>
  >;

  // Step actions
  @Select(ActionsState) actions$: Observable<Action[]>;

  featureForm: UntypedFormGroup;

  featureId: number;

  features: any[] = [];

  // Original files Upload Files 
  originalFiles: UploadedFile[] = [];

  constructor(
    public dialogRef: MatDialogRef<EditFeature>,
    @Inject(MAT_DIALOG_DATA) public data: IEditFeature,
    private _api: ApiService,
    private _snackBar: MatSnackBar,
    private _store: Store,
    private _dialog: MatDialog,
    private _fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private fileUpload: FileUploadService,
    @Inject(API_URL) public api_url: string,
    private inputFocusService: InputFocusService,
    private logger: LogService,
  ) {

    this.featureId = this.data.feature.feature_id;

    this.features = [
      {
        id: this.featureId,
        name: '',
        panels: Array.from({ length: 6 }, (_, i) => ({ id: (i + 1).toString(), expanded: false }))
      }
    ];

    this.inputFocusService.inputFocus$.subscribe(isFocused => {
      this.inputFocus = isFocused;
    });

    // Create the fields within FeatureForm
    this.featureForm = this._fb.group({
      app_name: ['', Validators.required],
      department_name: ['', Validators.required],
      environment_name: ['', Validators.required],
      feature_name: [
        '',
        Validators.compose([Validators.required, noWhitespaceValidator]),
      ],
      description: [''],
      schedule: [''],
      email_address: [[]],
      email_subject: [''],
      email_cc_address: [[]],
      email_bcc_address: [[]],
      email_body: [''],
      address_to_add: [''], // Used only for adding new email addresses
      depends_on_others: [false],
      run_now: [false], // Value changed to false so the create testcase dialog will have the schedule checkbox disabled by default
      send_mail: [false],
      network_logging: [false],
      generate_dataset: [false],
      need_help: [false],
      send_mail_on_error: [false],
      check_maximum_notification_on_error: [false],
      maximum_notification_on_error: ['3'],
      attach_pdf_report_to_email: [true],
      do_not_use_default_template: [false],
      continue_on_failure: [true],
      uploaded_files: [[]],
      video: [true],
      minute: [
        '0',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9,-/*]+$'),
        ]),
      ],
      hour: [
        '0',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9,-/*]+$'),
        ]),
      ],
      day_month: [
        '1',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9,-/*]+$'),
        ]),
      ],
      month: [
        '*',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9,-/*]+$'),
        ]),
      ],
      day_week: [
        '*',
        Validators.compose([
          Validators.required,
          Validators.pattern('^[0-9,-/*]+$'),
        ]),
      ],
    });
    // Gets the currently active route
    let route = this._store.selectSnapshot(FeaturesState.GetCurrentRouteNew);
    // Initialize the departments, applications and environments
    this.departments$ = this._store.selectSnapshot(
      UserState.RetrieveUserDepartments
    );
    this.applications$ = this._store.selectSnapshot(ApplicationsState);
    this.environments$ = this._store.selectSnapshot(EnvironmentsState);
    // Initialize the values selected by default on the mat selector
    // Selected the department where the user is currently at or the first available department, only used when creating a new testcase
    this.selected_department =
      route.length > 0 ? route[0].name : this.departments$[0].department_name;
    this.selected_application = this.applications$[0].app_name;
    this.selected_environment = this.environments$[0].environment_name;

    this.featureForm.valueChanges.subscribe(values => {
      const { minute, hour, day_month, month, day_week } = values;
      this.parseSchedule({ minute, hour, day_month, month, day_week });
    });
  }

  // Save the state of the expansion panel
  savePanelState(featureId: number, panelId: string, isExpanded: boolean) {
    // This object stores the expansion state of panels for each feature
    // Format: { "comment": "Panel expansion states per feature", "featureId": { "panelId": boolean } }
    const panelStates = JSON.parse(localStorage.getItem('co_mat_expansion_states') || '{"comment": "Panel expansion states per feature"}');

    if (!panelStates[featureId]) {
      panelStates[featureId] = {};
    }

    // Save the state of the panel
    panelStates[featureId][panelId] = isExpanded;
    localStorage.setItem('co_mat_expansion_states', JSON.stringify(panelStates));
  }

  // Load the state of the expansion panel


  getPanelSettingKey(panelId: number): string {
    const panelMap: { [key: number]: string } = {
      1: 'hideInformation',
      2: 'hideSendEmail',
      3: 'hideUploadedFiles',
      4: 'hideBrowsers',
      5: 'hideSteps',
      6: 'hideSchedule'
    };
  
    return panelMap[panelId];
  }

  loadPanelStates() {
    const savedStates = JSON.parse(localStorage.getItem('co_mat_expansion_states') || '{}');
  
    const userSettingsMap = {
      'hideBrowsers': this.user.settings.hideBrowsers,
      'hideInformation': this.user.settings.hideInformation,
      'hideSendMail': this.user.settings.hideSendMail,
      'hideSteps': this.user.settings.hideSteps,
      'hideSchedule': this.user.settings.hideSchedule,
      'hideUploadedFiles': this.user.settings.hideUploadedFiles,
    };
  
    this.features.forEach(feature => {
      if (!feature.id) return;
  
      feature.panels.forEach(panel => {
        //map panel.id to the appropriate setting key:
        const settingKey = this.getPanelSettingKey(panel.id);
        const userSetting = userSettingsMap[settingKey];
        // If setting is explicitly true, force it closed
        if (userSetting === true) {
          panel.expanded = false;
        } else {
          // otherwise, use saved state or default to open
          panel.expanded = savedStates[feature.id]?.[panel.id] ?? true;
        }
      });
    });
  }

  // When the expansion panel changes, save
  onExpansionChange(featureId: number, panelId: string, isExpanded: boolean) {
    this.savePanelState(featureId, panelId, isExpanded);

    // Expand only one panel at a time
    const feature = this.features.find(f => f.id === featureId);
    if (feature) {
      const panel = feature.panels.find(p => p.id === panelId);
      if (panel) {
        panel.expanded = isExpanded;
      }
    }
  }


  // // Check if the create button should be disabled
  // ngAfterViewInit() {
  //   setTimeout(() => {
  //     this.expansionPanels.changes.subscribe(() => this.setFocusOnFirstOpenPanel());
  //     this.setFocusOnFirstOpenPanel();
  //   });
  // }
  
  // Focus on the first input or textarea of the first open panel
  //Unused
  setFocusOnFirstOpenPanel() {
    setTimeout(() => {
      const firstOpenPanel = this.expansionPanels.find(panel => panel.expanded);
  
      if (firstOpenPanel) {
        setTimeout(() => { 
          const panelElement = firstOpenPanel._body?.nativeElement;
  
          if (panelElement) {
            // Filter the input have type hidden and checkbox
            const input = panelElement.querySelector('input:not([type="hidden"]):not([type="checkbox"]), textarea') as HTMLInputElement | HTMLTextAreaElement;
  
            if (input) {
              // Focus on the first input or textarea
              input.focus();
            }
          }
        }, 50);
      }
    });
  }
  

  ngOnDestroy() {
    // When Edit Feature Dialog is closed, clear temporal steps
    return this._store.dispatch(new StepDefinitions.ClearNewFeature());
    this.inputFocusSubscription.unsubscribe();
  }

  parseSchedule(expression) {
    // ignore if schedule is disabled
    if (!this.featureForm.value.run_now) return;

    try {
      // parse cron expression
      let parser = parseExpression(Object.values(expression).join(' '), {
        utc: true,
      });
      // reset errors
      this.parseError.error = false;
      // reset nextRuns arrays
      this.nextRuns = [];
      for (let i = 0; i < 5; i++) {
        this.nextRuns.push(parser.next().toDate().toLocaleString());
      }
    } catch (error) {
      this.nextRuns = [];
      this.parseError = {
        error: true,
        msg: error.message,
      };
    }
  }

  changeSchedule({ checked }: MatCheckboxChange) {
    this.featureForm.get('schedule').setValue(checked ? '' : checked);
    this.featureForm.get('schedule').markAsDirty();
  }

  openScheduleHelp() {
    this._dialog.open(ScheduleHelp, { width: '550px' });
  }

  // Add address to the addresses array
  addAddress(change: MatChipListChange, fieldName: string) {
    // Check email value
    if (change.value) {
      // Accounts with only Default department, are limited, they can only use their own email
      if (
        this.departments$.length === 1 &&
        this.departments$[0].department_name === 'Default' &&
        change.value !== this.user.email
      ) {
        this._snackBar.open(
          'Limited account: You can only add the email assigned to your account',
          'OK'
        );
        this.featureForm.get('address_to_add').setValue('');
        return;
      }
      // Get current addresses
      const addresses = this.featureForm.get(fieldName).value.concat();
      // Perform push only if address doesn't exist already
      if (!addresses.includes(change.value)) {
        addresses.push(change.value);
        this.featureForm.get(fieldName).setValue(addresses);
        this.featureForm.get(fieldName).markAsDirty();
      }
      this.featureForm.get('address_to_add').setValue('');
    }
  }

  // Open variables popup, only if a environment is selected (see HTML)
  editVariables() {
    const environmentId = this.environments$.find(
      env =>
        env.environment_name === this.featureForm.get('environment_name').value
    ).environment_id;
    const departmentId = this.departments$.find(
      dep =>
        dep.department_name === this.featureForm.get('department_name').value
    ).department_id;
    const feature = this.feature.getValue();

    this._dialog
      .open(EditVariablesComponent, {
        data: {
          feature_id: feature.feature_id,
          environment_id: environmentId,
          department_id: departmentId,
          department_name: this.featureForm.get('department_name').value,
          environment_name: this.featureForm.get('environment_name').value,
          feature_name: this.featureForm.get('feature_name').value,
        },
        panelClass: 'edit-variable-panel',
      })
      .afterClosed()
      .subscribe(res => {

      });
  }

  // Open variables popup, only if a environment is selected (see HTML)
  openStartEmulatorScreen() {
    let uploadedAPKsList = this.department.files.filter(file => file.name.endsWith('.apk'));
    const departmentId = this.departments$.find(
      dep =>
        dep.department_name === this.featureForm.get('department_name').value
    ).department_id;
    this._dialog
      .open(MobileListComponent, {
        data: {
          department_id: departmentId,
          uploadedAPKsList: uploadedAPKsList
        },
        panelClass: 'mobile-emulator-panel',
      })
      .afterClosed()
      .subscribe(res => {
      });
  }

  // Remove given address from addresses array
  removeAddress(email: string, fieldName: string) {
    if (email) {
      let addresses = this.featureForm.get(fieldName).value.concat();
      addresses = addresses.filter(addr => addr !== email);
      this.featureForm.get(fieldName).setValue(addresses);
      this.featureForm.get(fieldName).markAsDirty();
    }
  }

  handleBrowserChange(browsers) {
    this.browserstackBrowsers.next(browsers);
  }

  // Handle keyboard keys
  @HostListener('document:keydown', ['$event']) handleKeyboardEvent(
    event: KeyboardEvent
  ) {
    // If true... return | only execute switch case if input focus is false
    let KeyPressed = event.keyCode;
    const editVarOpen = document.querySelector('edit-variables') as HTMLElement;
    const startEmulatorOpen = document.querySelector('mobile-list') as HTMLElement;
    const apiScreenOpen = document.querySelector('.api-testing-container') as HTMLElement;
    if(editVarOpen == null && startEmulatorOpen == null && apiScreenOpen == null){
      switch (event.keyCode) {
        case KEY_CODES.ESCAPE:
          // Check if form has been modified before closing
          if (this.hasChanged()) {
            this._dialog
              .open(AreYouSureDialog, {
                data: {
                  title: 'translate:you_sure.quit_title',
                  description: 'translate:you_sure.quit_desc',
                } as AreYouSureData,
              })
              .afterClosed()
              .subscribe(exit => {
                // Close edit feature popup
                if (exit) this.dialogRef.close();
              });
          } else {
            this.dialogRef.close();
          }
          break;
        case KEY_CODES.V:
          // Only trigger shortcut if not focused on input and not using Ctrl+V
          if(!event.ctrlKey && !this.inputFocus){
            console.log('V KEY PRESSED EDIT VARIABLES');
            // Edit variables
            this.editVariables();
          }
          break;
        case KEY_CODES.D:
          if(!this.inputFocus) {
            // Depends on other feature
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.S:
          if(!this.inputFocus) {
            // Open Emulator mobile
            this.openStartEmulatorScreen();
          }
          break;
        case KEY_CODES.M:
          if(!this.inputFocus) {
            // Send email
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.R:
          if(!this.inputFocus) {
            // Record video
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.F:
          if(!this.inputFocus) {
            // Continue on failure
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.H:
          if(!this.inputFocus) {
            // Need help
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.N:
          if(!this.inputFocus) {
            // Network loggings
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        case KEY_CODES.G:
          if(!this.inputFocus) {
            // Generate dataset
            this.toggleDependsOnOthers(KeyPressed);
          }
          break;
        default:
          break;
      }
    }
  }

  // Shortcut emitter to parent component
  receiveDataFromChild(isFocused: boolean) {
    this.inputFocus = isFocused;
  }

  // Check if focused on input or textarea
  onInputFocus() {
    this.inputFocus = true;
  }

  onInputBlur() {
    this.inputFocus = false;
  }

  toggleDependsOnOthers(KeyPressed) {
    if(KeyPressed === KEY_CODES.D) {
      const dependsOnOthers = this.featureForm.get('depends_on_others').value;
      this.featureForm.get('depends_on_others').setValue(!dependsOnOthers);
    }
    else if (KeyPressed === KEY_CODES.F) {
      const continueOnFailure = this.featureForm.get('continue_on_failure').value;
      this.featureForm.get('continue_on_failure').setValue(!continueOnFailure);
    }
    else if (KeyPressed === KEY_CODES.H) {
      const needHelp = this.featureForm.get('need_help').value;
      this.featureForm.get('need_help').setValue(!needHelp);
    }
    else {
      const dependsOnOthers = this.featureForm.get('depends_on_others').value;
      if(dependsOnOthers === false) {
        if(KeyPressed === KEY_CODES.M) {
          const sendMail = this.featureForm.get('send_mail').value;
          this.featureForm.get('send_mail').setValue(!sendMail);
        }
        else if (KeyPressed === KEY_CODES.R) {
          const video = this.featureForm.get('video').value;
          this.featureForm.get('video').setValue(!video);
        }
        else if (KeyPressed === KEY_CODES.N) {
          const networkLogging = this.featureForm.get('network_logging').value;
          this.featureForm.get('network_logging').setValue(!networkLogging);
        }
        else if (KeyPressed === KEY_CODES.G) {
          const generateDataset = this.featureForm.get('generate_dataset').value;
          this.featureForm.get('generate_dataset').setValue(!generateDataset);
        }
      }
    }
  }

  // Check if mouse is over the dialog (puede ser step definition?)
  isHovered = false;

  onMouseOver() {
    this.isHovered = true;
  }

  onMouseOut() {
    this.isHovered = false;
  }


  // Deeply check if two arrays are equal, in length and values
  arraysEqual(a: any[], b: any[]): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  /**
   * Check if edit feature form has different values from original object
   */
  hasChanged(): boolean {
    // Retrieve original feature data, when mode is `new` it will only have `feature_id: 0`
    const featureOriginal = this.feature.getValue();
    /**
     * Detect changes in formular
     * Procedure:
     *  1. Check if formular has been modified (dirty)
     *  2. Check if the form field has been modified (dirty)
     *  3. Check if the original feature value is different from the new one
     */
    if (this.featureForm.dirty) {
      // The first selectors needs custom comparison logic
      // Check Department
      const departmentField = this.featureForm.get('department_name');
      if (departmentField.dirty && departmentField.value) {
        const departmentId = this.departments$.find(
          dep => dep.department_name === departmentField.value
        ).department_id;
        if (
          this.data.mode === 'new' ||
          featureOriginal.department_id !== departmentId
        )
          return true;
      }
      // Check application
      const applicationField = this.featureForm.get('app_name');
      if (applicationField.dirty && applicationField.value) {
        const appId = this.applications$.find(
          app => app.app_name === applicationField.value
        ).app_id;
        if (this.data.mode === 'new' || featureOriginal.app_id !== appId)
          return true;
      }
      // Check environment
      const environmentField = this.featureForm.get('environment_name');
      if (environmentField.dirty && environmentField.value) {
        const environmentId = this.environments$.find(
          env => env.environment_name === environmentField.value
        ).environment_id;
        if (
          this.data.mode === 'new' ||
          featureOriginal.environment_id !== environmentId
        )
          return true;
      }
      // Declare an array of fields with the same key name in original feature and modified
      let fields = [
        'description',
        'depends_on_others',
        'send_mail',
        'need_help',
        'feature_name',
        'video',
        'continue_on_failure',
      ];
      // Add fields mandatory for Send email
      if (this.featureForm.get('send_mail').value) {
        fields = [
          ...fields,
          'email_address',
          'email_cc_address',
          'email_bcc_address',
          'email_subject',
          'email_body',
          'send_mail_on_error',
          'maximum_notification_on_error',
          'check_maximum_notification_on_error',
          'attach_pdf_report_to_email',
          'do_not_use_default_template',
        ];
      }
      // Add fields mandatory for Schedule
      if (this.featureForm.get('run_now').value) {
        fields = [
          ...fields,
          'minute',
          'hour',
          'day_month',
          'month',
          'day_week',
        ];
      }
      // Iterate each field
      for (const key of fields) {
        const field = this.featureForm.get(key);
        // Check if field is changed and has value
        if (field.dirty && field.value) {
          // Custom logic for array values
          if (Array.isArray(field.value)) {
            if (
              this.data.mode === 'new' ||
              JSON.stringify(field.value) !==
                JSON.stringify(featureOriginal[key])
            ) {
              return true;
            }
          } else {
            if (featureOriginal[key] !== field.value) {
              return true;
            }
          }
        }
      }
    }
    /**
     * Detect changes made outside of formular code
     */
    // Check browsers
    if (
      JSON.stringify(this.browsersOriginal) !==
      JSON.stringify(this.browserstackBrowsers.getValue())
    )
      return true;
    /**
     * Detect changes in Step Editor
     */
    if (this.stepEditor) {
      const currentSteps = this.stepEditor.getSteps();
      if (this.stepsOriginal.length === currentSteps.length) {
        // Deep compare then
        // Compare step fields
        const fieldsToCompare = [
          'step_content',
          'enabled',
          'screenshot',
          'compare',
        ];
        for (let i = 0; i < currentSteps.length; i++) {
          for (const field of fieldsToCompare) {
            if (currentSteps[i][field] !== this.stepsOriginal[i][field]) {
              return true;
            }
          }
        }
      } else {
        return true;
      }
    }
    return false;
  }

  @ViewChild(BrowserSelectionComponent, { static: false })
  _browserSelection: BrowserSelectionComponent;
  configValueBoolean: boolean = false;

  ngOnInit() {

    // Initialize department if there's already a value in the form
    if (this.featureForm.get('department_name').value) {
      this.allDepartments$.subscribe(data => {
        this.department = data.find(
          dep => dep.department_name === this.featureForm.get('department_name').value
        );
        if (this.department?.files) {
          this.originalFiles = [...this.department.files];
        }
        this.cdr.detectChanges();
      });
    }

    // Subscribe to department name changes
    this.featureForm
      .get('department_name')
      .valueChanges.subscribe(department_name => {
        this.allDepartments$.subscribe(data => {
          if (!data) return;
          
          this.department = data.find(
            dep => dep.department_name === department_name
          );
          
          if (this.department) {
            if (this.department.files) {
              this.originalFiles = [...this.department.files];
            }
            this.fileUpload.validateFileUploadStatus(this.department);
          }
          this.cdr.detectChanges();
        });
      });

    // Initialize localStorage with a comment if it doesn't exist
    if (!localStorage.getItem('co_mat_expansion_states')) {
      localStorage.setItem('co_mat_expansion_states', JSON.stringify({
        "comment": "Panel expansion states per feature",
        "Default": {}
      }));
    }

    // Show panel expansion states from localstorage
    this.logger.msg('4', 'Localstorage panel expansion states', localStorage.getItem('co_mat_expansion_states'));
    
    // Show panel states from user settings
    this.logger.msg('4', 'Panel States', 'User current panel states:' + JSON.stringify(this.user.settings));

    this.loadPanelStates();

    this._api.getCometaConfigurations().subscribe(res => {

      const config_feature_mobile = res.find((item: any) => item.configuration_name === 'COMETA_FEATURE_MOBILE_TEST_ENABLED');
      if (config_feature_mobile) {
        this.configValueBoolean = !!JSON.parse(config_feature_mobile.configuration_value.toLowerCase());
        this.cdr.detectChanges();
      }
    })

    // Connection with the service who is connected with Step-editor
    this.inputFocusSubscription = this.inputFocusService.inputFocus$.subscribe(isFocused => {
      this.inputFocus = isFocused;
    });

    this.checkForCreateButton();

    this.featureForm.valueChanges.subscribe(() => {
      this.variableState$.subscribe(data => {
        this.variables = this.getFilteredVariables(data);
      });
    });

    if (this.data.mode === 'edit' || this.data.mode === 'clone') {
      // Code for editing feautre
      const featureInfo = this.data.info;
      // Initialize the selected by default application, department and environment
      this.selected_application = featureInfo.app_name;
      this.selected_department = featureInfo.department_name;
      this.selected_environment = featureInfo.environment_name;
      this.feature.next(featureInfo);
      // Assign observable of department settings
      this.departmentSettings$ = this._store.select(
        CustomSelectors.GetDepartmentSettings(featureInfo.department_id)
      );
      this.browserstackBrowsers.next(featureInfo.browsers);
      this.browsersOriginal = deepClone(featureInfo.browsers);
      this.featureForm.get('run_now').setValue(featureInfo.schedule !== '');
      if (featureInfo.schedule) {
        const cron_fields = [
          'minute',
          'hour',
          'day_month',
          'month',
          'day_week',
        ];
        const cron_values = featureInfo.schedule.split(' ');
        for (let i = 0; i < cron_fields.length; i++) {
          this.featureForm.get(cron_fields[i]).setValue(cron_values[i]);
        }
      }
      // Try to save all possible feature properties in the form using the same property names
      for (const key in featureInfo) {
        if (this.featureForm.get(key) instanceof UntypedFormControl) {
          this.featureForm.get(key).setValue(featureInfo[key]);
        }
      }
      this.stepsOriginal = this.data.steps;
    } else {
      // Code for creating a feature
      // set user preselect options
      this.feature.next(this.data.feature);
      this.preSelectedOptions();
    }
    // @ts-ignore
    if (!this.feature) this.feature = { feature_id: 0 };
    const featureId =
      this.data.mode === 'clone' ? 0 : this.data.feature.feature_id;
    this.steps$ = this._store.select(
      CustomSelectors.GetFeatureSteps(featureId)
    );

    this.featureForm
      .get('department_name')
      .valueChanges.subscribe(department_name => {
        this.allDepartments$.subscribe(data => {
          this.department = data.find(
            dep => dep.department_name === department_name
          );
          this.fileUpload.validateFileUploadStatus(this.department);
          this.cdr.detectChanges();
        });
      });
  }

  /**
   * Select user specified selections if any.
   */
  preSelectedOptions() {
    const {
      preselectDepartment,
      preselectApplication,
      preselectEnvironment,
      recordVideo,
    } = this.user.settings;

    this.departments$.find(d => {
      if (d.department_id == preselectDepartment)
        this.selected_department = d.department_name;
    });
    this.applications$.find(a => {
      if (a.app_id == preselectApplication)
        this.selected_application = a.app_name;
    });
    this.environments$.find(e => {
      if (e.environment_id == preselectEnvironment)
        this.selected_environment = e.environment_name;
    });
    this.featureForm.patchValue({
      video: recordVideo != undefined ? recordVideo : true,
      // ... add addition properties here.
    });
  }

  stepsOriginal: FeatureStep[] = [];
  browsersOriginal: BrowserstackBrowser[] = [];

  feature = new BehaviorSubject<Feature>(null);

  /**
   * Auto focus to the given form control
   * @param name Name of the control
   */
  focusFormControl(name: string) {
    try {
      // Get form control element
      const element = document.querySelector(
        `[formcontrolname="${name}"]`
      ) as HTMLElement;
      // Scroll element into user view
      element.scrollIntoView({
        block: 'center',
        behavior: 'smooth',
      });
      // Auto focus to it
      element.focus();
    } catch (err) {
      console.log(`Couldn\'t focus on ${name} control.`);
    }
  }

  openEmailHelp() {
    this._dialog.open(EmailTemplateHelp);
  }

  /**
   * Open are you sure dialog and wait for response
   */
  async openAreYouSureDialog(): Promise<boolean> {
    const dialogRef = this._dialog.open(AreYouSureDialog, {
      data: {
        title: `Save ${this.featureForm.get('feature_name').value}`,
        description:
          'Are you sure you want to save this feature? One or more steps contain errors.',
      } as AreYouSureData,
    });

    return dialogRef
      .afterClosed()
      .toPromise()
      .then(answer => {
        return Promise.resolve(answer);
      });
  }

  /**
   * Creates a new feature or edits an existing one. It executes whenever the user clicks on the create / save button in the feature dialog
   * @returns
   */
  async editOrCreate() {
    // Reset search before proceeding
    this.resetSearch();
    
    // Get current steps from Store
    let currentSteps = [];
    if (this.stepEditor) {
      // Check if StepEditor exists
      currentSteps = this.stepEditor.getSteps();
      if (this.stepEditor.stepsForm) {
        // Check steps validity
        if (!this.stepEditor.stepsForm.valid) {
          const result = await this.openAreYouSureDialog();
          if (!result) {
            // Focus on on first invalid step
            try {
              document
                .querySelector<HTMLTextAreaElement>('.invalid-step textarea')
                .focus();
            } catch (err) {
              console.log('Failed to focus on step input');
            }
            return;
          }
          /**
           OLD LOGIC - Before 2021-12-30
          this._snackBar.open('One or more steps are invalid, fix them before saving.', 'OK', { duration: 5000 });
          // Focus on on first invalid step
          try {
            document.querySelector<HTMLTextAreaElement>('.invalid-step textarea').focus();
          } catch (err) { console.log('Failed to focus on step input') }
          return;
          */
        }
      }
    } else {
      // If StepEditor doesn't exist grab steps from Store
      // @ts-ignore
      if (!this.feature) this.feature = { feature_id: 0 };
      const featureId =
        this.data.mode === 'clone' ? 0 : this.data.feature.feature_id;
      currentSteps = this._store.selectSnapshot(
        CustomSelectors.GetFeatureSteps(featureId)
      );
    }
    const steps = {
      // Remove empty steps
      steps_content: currentSteps.filter(step => !!step.step_content),
      screenshots: [],
      compares: [],
    };
    // Create screenshots and compares arrays from current steps
    steps.steps_content
      .filter(step => step.enabled)
      .forEach((item, index) => {
        if (item.screenshot) steps.screenshots.push(index + 1);
        if (item.compare) steps.compares.push(index + 1);
      });
    const incompletePrefix = 'Feature info is incomplete';
    // Get current selectors information ids
    let departmentId, appId, environmentId;
    // Check Department ID
    try {
      departmentId = this.departments$.find(
        dep =>
          dep.department_name === this.featureForm.get('department_name').value
      ).department_id;
    } catch (err) {
      this.focusFormControl('department_name');
      this._snackBar.open(`${incompletePrefix}: missing department`);
      return;
    }
    // Check App ID
    try {
      appId = this.applications$.find(
        app => app.app_name === this.featureForm.get('app_name').value
      ).app_id;
    } catch (err) {
      this.focusFormControl('app_name');
      this._snackBar.open(`${incompletePrefix}: missing application`);
      return;
    }
    // Check Environment ID
    try {
      environmentId = this.environments$.find(
        env =>
          env.environment_name ===
          this.featureForm.get('environment_name').value
      ).environment_id;
    } catch (err) {
      this.focusFormControl('environment_name');
      this._snackBar.open(`${incompletePrefix}: missing environment`);
      return;
    }
    // Check Feature Name
    if (!this.featureForm.get('feature_name').valid) {
      this.focusFormControl('feature_name');
      this._snackBar.open(`${incompletePrefix}: missing name`);
      return;
    }
    const fValues = this.featureForm.value;
    // Create FormData for sending XHR
    const dataToSend = {
      ...this.featureForm.value,
      steps: steps,
      environment_id: environmentId,
      app_id: appId,
      department_id: departmentId,
      browsers: this.browserstackBrowsers.getValue(),
    };
    // Construct schedule for sending
    if (fValues.run_now) {
      dataToSend.schedule = [
        fValues.minute,
        fValues.hour,
        fValues.day_month,
        fValues.month,
        fValues.day_week,
      ].join(' ');
    } else {
      dataToSend.schedule = '';
    }

    // --------------------------------------------
    // Save XHR
    // ... now dataToSend has been prepared and we can send it to Backend
    // ... Different for save & clone and create
    // ... create dialog asks if you want to run it now
    // ... data.mode can be 'new', 'clone', 'edit'
    // -------------------------------------------------
    // Special code for when editing or clonning feature
    // -------------------------------------------------
    dataToSend.feature_id = this.data.feature.feature_id;
    dataToSend.cloud = this.feature.getValue().cloud;
    if (this._browserSelection) {
      dataToSend.cloud = this._browserSelection.testing_cloud.value;
    }
    if (this.data.mode === 'clone' || this.data.mode === 'new') {
      dataToSend.feature_id = 0;
    }
    this.saving$.next(true);
    this._api
      .patchFeature(dataToSend.feature_id, dataToSend, {
        loading: 'translate:tooltips.saving_feature',
      })
      .pipe(finalize(() => this.saving$.next(false)))
      .subscribe(res => {
        // res.info contains the feature data
        // res.success contains true or false

        // After sending the XHR we have received the result in "res"
        // Checking for success and not
        // .... show snackBar
        // .... move feature to folder, if necesarry
        // .... show dialog according to new or clone & save/edit
        if (res.success) {
          // If XHR was ok
          this._snackBar.open('Feature saved.', 'OK');
          this._store.dispatch(new Features.UpdateFeatureOffline(res.info));
          // Toggles the welcome to false, meaning that the user is no longer new in co.meta
          this.toggleWelcome();
          this.manageFeatureDialogData(res, dataToSend);
        } else {
          // If XHR was ok
          this._snackBar.open('An error occurred.', 'OK');
        }
      });
  }

  /**
   * Decides what to do with the data after clicking submit on the feature edit dialog: clone, create or edit feature
   * @param res
   * @param dataToSend
   * @author dph000
   * @date 2021/10/25
   */
  manageFeatureDialogData(res, dataToSend) {
    // Move to current folder
    if (this.data.mode === 'clone' || this.data.mode === 'new') {
      this.moveFeatureToCurrentFolder(res.info.feature_id).subscribe();
      this._store.dispatch(new Features.GetFolders());
    }

    // dialog when saving or cloning
    if (this.data.mode === 'edit' || this.data.mode === 'clone') {
      // dialog for clone and save
      this.dialogRef.close(dataToSend);
    } else {
      // dialog when creating offering option to run report
      if (res.info.feature_id) {
        this._dialog.open(FeatureCreated, {
          minWidth: '500px',
          data: {
            feature_name: dataToSend.feature_name,
            feature_id: res.info.feature_id,
            app_name: dataToSend.app_name,
            environment_name: dataToSend.environment_name,
            department_name: dataToSend.department_name,
            description: dataToSend.description,
          },
        });
        this.dialogRef.close(dataToSend);
      }
    }
  }

  /**
   * Checks if the current user is inside a folder and moves
   * the just created/cloned feature inside it
   * @param {number} featureId Feature ID
   */
  moveFeatureToCurrentFolder(featureId: number): Observable<any> {
    // Get current folder route
    const currentRoute = this._store
      .selectSnapshot(FeaturesState.GetSelectionFolders)
      .filter(route => route.type != 'department');
    // Check if changing folder of created feature is necessary
    if (currentRoute.length > 0) {
      // Get current folder id
      const folderId = currentRoute[currentRoute.length - 1].folder_id;
      // Move feature in backend
      return this._api.moveFeatureFolder(null, folderId, featureId).pipe(
        switchMap(res => {
          if (res.success) {
            // Update folders in front
            return this._store.dispatch(new Features.GetFolders());
          }
          // Check errors
          if (!res.success && !res.handled) {
            this._snackBar.open(
              'An error ocurred while moving feature to folder.',
              'OK'
            );
          }
          return of({});
        })
      );
    } else {
      return of({});
    }
  }

  checkboxChange = ({ checked }: MatCheckboxChange, key: string) => {
    this.featureForm.get(key).setValue(checked);
    this.featureForm.get(key).markAsDirty();
  };

  /**
   * Toggle the co_first_time_cometa local storage variable, meaning that the user has already created a testcase
   * @returns new Configuration of co_first_time_cometa
   * @author dph000
   * @date 21/11/02
   * @lastModification 21/11/02
   */
  toggleWelcome() {
    return this._store.dispatch(
      new Configuration.SetProperty('co_first_time_cometa', 'false', true)
    );
  }

  // adds each selected file into formControl array
  onUploadFile(ev) {
    let formData: FormData = new FormData();
    let files = ev.target.files;

    for (let file of files) {
      formData.append('files', file);
    }
    formData.append('department_id', this.department.department_id);

    this.fileUpload.startUpload(files, formData, this.department, this.user);
  }

  onDownloadFile(file: UploadedFile) {
    // return if file is still uploading
    if (file.status.toLocaleLowerCase() != 'done') {
      return;
    }

    const downloading = this._snackBar.open(
      'Generating file to download, please be patient.',
      'OK',
      { duration: 10000 }
    );

    this.fileUpload.downloadFile(file.id).subscribe({
      next: res => {
        const blob = new Blob([this.base64ToArrayBuffer(res.body)], {
          type: file.mime,
        });
        this.fileUpload.downloadFileBlob(blob, file);
        downloading.dismiss();
      },
      error: err => {
        if (err.error) {
          const errors = JSON.parse(err.error);
          this._snackBar.open(errors.error, 'OK');
        }
      },
    });
  }

  base64ToArrayBuffer(data: string) {
    const byteArray = atob(data);
    const uint = new Uint8Array(byteArray.length);
    for (let i = 0; i < byteArray.length; i++) {
      let ascii = byteArray.charCodeAt(i);
      uint[i] = ascii;
    }
    return uint;
  }

  onDeleteFile(file: UploadedFile) {
    this.fileUpload.deleteFile(file.id).subscribe(res => {
      if (res.success) this.fileUpload.updateFileState(file, this.department);
    });
  }

  onRestoreFile(file: UploadedFile) {
    let formData: FormData = new FormData();
    formData.append('restore', String(file.is_removed));

    this.fileUpload.restoreFile(file.id, formData).subscribe(res => {
      if (res.success) this.fileUpload.updateFileState(file, this.department);
    });
  }

  public onFilePathCopy(successful: boolean): void {
    const duration = 2000;
    successful
      ? this._snackBar.open('File upload path has been copied', 'OK', {
          duration: duration,
        })
      : this._snackBar.open('File upload path could not be copied', 'OK', {
          duration: duration,
        });
  }

  getFilteredVariables(variables: VariablePair[]) {
    const environmentId = this.environments$.find(
      env =>
        env.environment_name === this.featureForm.get('environment_name').value
    )?.environment_id;
    const departmentId = this.departments$.find(
      dep =>
        dep.department_name === this.featureForm.get('department_name').value
    )?.department_id;

    let feature = this.feature.getValue();
    let reduced = variables.reduce(
      (filtered_variables: VariablePair[], current: VariablePair) => {
        // stores variables, if it's id coincides with received department id and it is based on department
        const byDeptOnly =
          current.department === departmentId && current.based == 'department'
            ? current
            : null;

        // stores variable if department id coincides with received department id and
        // environment or feature ids coincide with received ones, additionally if feature id coincides variable must be based on feature. If environment id coincides, variables must be based on environment.
        const byEnv =
          current.department === departmentId &&
          ((current.environment === environmentId &&
            current.based == 'environment') ||
            (current.feature === feature.feature_id &&
              current.based == 'feature'))
            ? current
            : null;

        // pushes stored variables into array if they have value
        byDeptOnly ? filtered_variables.push(byDeptOnly) : null;
        byEnv ? filtered_variables.push(byEnv) : null;

        // removes duplicated variables and returs set like array
        return filtered_variables.filter(
          (value, index, self) =>
            index === self.findIndex(v => v.id === value.id)
        );
      },
      []
    );
    return reduced;
  }

  checkForCreateButton() {
    if (this.data.mode == 'new') {
      this.isExpanded = true;
    }
    else if (this.data.mode === 'edit' || this.data.mode === 'clone'){
      this.isExpanded = false;
    }
  }

  // Filter files in the upload files section
  filterFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.toLowerCase();
  
    if (value === '') {
      // If the input is empty, show all files
      this.department.files = [...this.originalFiles];
    } else {
      // If there is text, filter the files
      this.department.files = this.originalFiles.filter(file => 
        file.name.toLowerCase().includes(value)
      );
    }
    // Force change detection
    this.cdr.detectChanges();
  }

  // Reset search input and file list
  resetSearch() {
    // Reset the file list to original state without forcing change detection
    if (this.department && this.originalFiles) {
      setTimeout(() => {
        this.department.files = [...this.originalFiles];
      }, 1000);
    }
  }

}
