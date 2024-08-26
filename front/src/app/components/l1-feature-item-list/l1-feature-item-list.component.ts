/**
 * l1-feature-item-list.component.ts
 *
 * Contains the code to control the behaviour of the item list (each feature is a squared item) in the new landing
 *
 * @author dph000
 */
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { UserState } from '@store/user.state';
import { Observable, switchMap, tap, map } from 'rxjs';
import { CustomSelectors } from '@others/custom-selectors';
import { observableLast, Subscribe } from 'ngx-amvara-toolbox';
import { NavigationService } from '@services/navigation.service';
import { ViewSelectSnapshot } from '@ngxs-labs/select-snapshot';
import { SharedActionsService } from '@services/shared-actions.service';
import { Features } from '@store/actions/features.actions';
import { AddFolderComponent } from '@dialogs/add-folder/add-folder.component';
import { ApiService } from '@services/api.service';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { LogService } from '@services/log.service';
import { FeatureRunningPipe } from '../../pipes/feature-running.pipe';
import { DepartmentNamePipe } from '@pipes/department-name.pipe';
import { BrowserComboTextPipe } from '../../pipes/browser-combo-text.pipe';
import { SecondsToHumanReadablePipe } from '@pipes/seconds-to-human-readable.pipe';
import { AmDateFormatPipe } from '@pipes/am-date-format.pipe';
import { AmParsePipe } from '@pipes/am-parse.pipe';
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatLegacyMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyButtonModule } from '@angular/material/legacy-button';
import { MatLegacyProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { StopPropagationDirective } from '../../directives/stop-propagation.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyTooltipModule } from '@angular/material/legacy-tooltip';
import { LetDirective } from '../../directives/ng-let.directive';
import { Router } from '@angular/router';
import {
  NgIf,
  NgClass,
  NgSwitch,
  NgSwitchCase,
  AsyncPipe,
  LowerCasePipe,
} from '@angular/common';
import { L1LandingComponent } from '@components/l1-landing/l1-landing.component';
import { FeaturesState } from '@store/features.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'cometa-l1-feature-item-list',
  templateUrl: './l1-feature-item-list.component.html',
  styleUrls: ['./l1-feature-item-list.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    LetDirective,
    MatLegacyTooltipModule,
    NgClass,
    MatIconModule,
    StopPropagationDirective,
    MatLegacyProgressSpinnerModule,
    NgSwitch,
    NgSwitchCase,
    MatLegacyButtonModule,
    MatLegacyMenuModule,
    MatDividerModule,
    MatLegacyCheckboxModule,
    TranslateModule,
    AmParsePipe,
    AmDateFormatPipe,
    SecondsToHumanReadablePipe,
    BrowserComboTextPipe,
    DepartmentNamePipe,
    FeatureRunningPipe,
    AsyncPipe,
    LowerCasePipe,
    CommonModule
  ],
})
export class L1FeatureItemListComponent implements OnInit {
  constructor(
    private _router: NavigationService,
    private _store: Store,
    public _sharedActions: SharedActionsService,
    private _dialog: MatDialog,
    private _api: ApiService,
    private _snackBar: MatSnackBar,
    private log: LogService,
  ) {}

  // Receives the item from the parent component
  @Input() item: any;
  @ViewSelectSnapshot(UserState.GetPermission('create_feature'))
  canCreateFeature: boolean;
  @Input() feature_id: number;
  @Input() folderId: string;

  @ViewChild(L1LandingComponent) l1LandingComponent: L1LandingComponent;
  /**
   * Global variables
   */
  feature$: Observable<Feature>;
  featureRunning$: Observable<boolean>;
  featureStatus$: Observable<string>;
  canEditFeature$: Observable<boolean>;
  canDeleteFeature$: Observable<boolean>;
  isAnyFeatureRunning$: Observable<boolean>;
  departmentFolders$: Observable<Folder[]>;
  @Select(FeaturesState.GetNewSelectionFolders) currentRoute$: Observable<
  ReturnType<typeof FeaturesState.GetNewSelectionFolders>
>;

  // NgOnInit
  ngOnInit() {
    this.log.msg('1', 'Inicializing component...', 'feature-item-list');

    this.feature$ = this._store.select(
      CustomSelectors.GetFeatureInfo(this.feature_id)
    );
    // Subscribe to the running state comming from NGXS
    this.featureRunning$ = this._store.select(
      CustomSelectors.GetFeatureRunningStatus(this.feature_id)
    );
    // Subscribe to the status message comming from NGXS
    this.featureStatus$ = this._store.select(
      CustomSelectors.GetFeatureStatus(this.feature_id)
    );
    this.canEditFeature$ = this._store.select(
      CustomSelectors.HasPermission('edit_feature', this.feature_id)
    );
    this.canDeleteFeature$ = this._store.select(
      CustomSelectors.HasPermission('delete_feature', this.feature_id)
    );

    this.isAnyFeatureRunning$ = this._sharedActions.folderRunningStates.asObservable().pipe(
      map(runningStates => runningStates.get(this.item.id) || false)
    );

    this.currentRoute$.subscribe( algo => {
      console.log(algo)
    })
  }

  async goLastRun() {
    const feature = await observableLast<Feature>(this.feature$);
    this._router.navigate(
      [
        `/${feature.info.app_name}`,
        feature.info.environment_name,
        feature.info.feature_id,
        'step',
        feature.info.feature_result_id,
      ],
      {
        queryParams: {
          runNow: 1,
        },
      }
    );
  }

  /**
   * Folder control functions
   */

  // Go to the clicked folder
  goFolder(route: Folder[]) {
    this.log.msg('1', 'Opening folder...', 'feature-item-list', route);
    // dispach the route of clicked folder
    this._store.dispatch(new Features.SetFolderRoute(route));

    // get absolute path of current route, including department
    const currentRoute = this._store.snapshot().features.currentRouteNew;

    // add clicked folder's id hierarchy to url params
    this._sharedActions.set_url_folder_params(currentRoute);
  }

  // Modify the clicked folder
  modify(folder: Folder) {
    this._dialog.open(AddFolderComponent, {
      autoFocus: true,
      data: {
        mode: 'edit',
        folder: folder,
      } as IEditFolder,
    });
  }

  // Delete the clicked folder
  @Subscribe()
  delete(folder: Folder) {
    this.log.msg('1', 'Deleting folder...', 'feature-item-list', folder);
    return this._api.removeFolder(folder.folder_id).pipe(
      switchMap(_ => this._store.dispatch(new Features.GetFolders())),
      tap(_ => this._snackBar.open(`Folder ${folder.name} removed`, 'OK'))
    );
  }

  // Moves the selected folder
  SAmoveFolder(folder: Folder) {
    this.log.msg('1', 'Moving folder...', 'feature-item-list', folder);
    this._sharedActions.moveFolder(folder);
  }

  // Moves the selected feature
  SAmoveFeature(feature: Feature) {
    this.log.msg('1', 'Moving feature...', 'feature-item-list', feature);
    this._sharedActions.moveFeature(feature);
  }

  goToFolder(folder: Partial<Folder>) {
    console.log('Clicked folder:', folder);
  //   this.departmentFolders$ = this._store.select(CustomSelectors.GetDepartmentFolders());
  //   this._sharedActions.getData$().subscribe(data => {
  //     console.log(data);
      
  //     let departmentNumber = 0; 
  //     let folderHierarchyCount = '';
      
  //     const traverseFolders = (folders: Folder[]) => {
  //       folders.forEach(folder => {
  //         if (folder.folder_id) {
  //           console.log("folder.folder_id: ", folder.folder_id);
  //           folderHierarchyCount += `:${folder.folder_id}`;
  //           console.log("Current folderHierarchyCount: ", folderHierarchyCount);
  //         }
          
  //         if (folder.folders.length > 0) {
  //           traverseFolders(folder.folders); 
  //         }
  //       });
  //     };
      
  //     // console.log("Traverse: ", traverseFolders);
      
  //     this.departmentFolders$.subscribe(departmentFolders => {
  //       const department = departmentFolders.find(dept => 
  //         dept.name === data.rows[0]?.department
  //       );
  //       console.log("This all dep: ", departmentFolders);

  //       // console.log("This folder_id second: ", department.folder_id);

  //       console.log("Department: ", data.rows[0]);

  //       console.log("Department: ", data.rows[0]?.department);
        
  //       if (department) {
  //         departmentNumber = department.folder_id;
          
  //         if (department.folders.length > 0) {
  //           traverseFolders(department.folders); 
  //         }
  //       } else {
  //         console.warn("Department don't allow.");
  //       }
  //     });
      
  //     const folderHierarchyCountNumber = Number(folderHierarchyCount);
      
  //     const url = `https://localhost/debug/#/new/:${departmentNumber}${folderHierarchyCount}`;
  //     console.log("URL construida:", url);
  //     // this._router.navigate([url]);
  //   });
  }
}
