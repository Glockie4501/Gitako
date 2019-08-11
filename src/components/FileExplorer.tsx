import * as React from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import connect from 'driver/connect'
import { FileExplorer as FileExplorerCore } from 'driver/core'
import SearchBar from 'components/SearchBar'
import Node from 'components/Node'
import LoadingIndicator from 'components/LoadingIndicator'
import cx from 'utils/cx'
import { ConnectorState } from 'driver/core/FileExplorer'
import { TreeData, MetaData } from 'utils/GitHubHelper'
import { VisibleNodes, TreeNode } from 'utils/VisibleNodesGenerator'
import Icon from './Icon'
import SizeObserver from './SizeObserver'

export type Props = {
  treeData?: TreeData
  metaData: MetaData
  freeze: boolean
  compressSingletonFolder: boolean
  accessToken: string | undefined
  toggleShowSettings: React.MouseEventHandler
}

class FileExplorer extends React.Component<Props & ConnectorState> {
  static defaultProps: Partial<Props & ConnectorState> = {
    freeze: false,
    searchKey: '',
    searched: false,
    visibleNodes: null,
  }

  componentWillMount() {
    const { init, setUpTree, treeData } = this.props
    init()
    setUpTree(treeData)
  }

  componentDidMount() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  componentWillReceiveProps(nextProps: Props & ConnectorState) {
    if (nextProps.treeData !== this.props.treeData) {
      const { setUpTree } = nextProps
      setUpTree()
    }
  }

  componentDidUpdate() {
    const { execAfterRender } = this.props
    execAfterRender()
  }

  VirtualNode = React.memo<ListChildComponentProps>(({ index, style }) => {
    const { visibleNodes, onNodeClick } = this.props
    if (!visibleNodes) return null
    const { nodes, depths, focusedNode, expandedNodes } = visibleNodes
    const node = nodes[index]
    return (
      <Node
        style={style}
        key={node.path}
        node={node}
        depth={depths.get(node) || 0}
        focused={focusedNode === node}
        expanded={expandedNodes.has(node)}
        onClick={onNodeClick}
        renderActions={this.renderActions}
      />
    )
  })

  renderFiles(visibleNodes: VisibleNodes) {
    const { nodes } = visibleNodes
    const { searchKey } = this.props
    const inSearch = searchKey !== ''
    if (inSearch && nodes.length === 0) {
      return <label className={'no-results'}>No results found.</label>
    }
    return (
      <SizeObserver className={'files'}>
        {({ width, height }) =>
          height &&
          width && (
            <List
              itemKey={(index, { nodes }) => {
                const node = nodes[index]
                return node && node.path
              }}
              itemData={{ nodes }}
              height={height}
              itemCount={nodes.length}
              itemSize={35}
              width={width}
            >
              {this.VirtualNode}
            </List>
          )
        }
      </SizeObserver>
    )
  }

  private renderActions: Node['props']['renderActions'] = node => {
    const { searchKey, searched, goTo } = this.props
    return (
      searchKey &&
      searched && (
        <div className={'go-to-wrapper'}>
          <button className={'go-to-button'} onClick={this.revealNode(goTo, node)}>
            <Icon type="go-to" />
            &nbsp; Reveal in file tree
          </button>
        </div>
      )
    )
  }

  revealNode(
    goTo: (path: string[]) => void,
    node: TreeNode,
  ): (event: React.MouseEvent<HTMLElement, MouseEvent>) => void {
    return e => {
      e.stopPropagation()
      e.preventDefault()
      goTo(node.path.split('/'))
    }
  }

  render() {
    const {
      stateText,
      visibleNodes,
      freeze,
      handleKeyDown,
      handleSearchKeyChange,
      onNodeClick,
      toggleShowSettings,
      onFocusSearchBar,
      searchKey,
    } = this.props
    return (
      <div
        className={cx(`file-explorer`, { freeze })}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        onClick={freeze ? toggleShowSettings : undefined}
      >
        {stateText ? (
          <LoadingIndicator text={stateText} />
        ) : (
          visibleNodes && (
            <React.Fragment>
              <SearchBar
                searchKey={searchKey}
                onSearchKeyChange={handleSearchKeyChange}
                onFocus={onFocusSearchBar}
              />
              {this.renderFiles(visibleNodes)}
            </React.Fragment>
          )
        )}
      </div>
    )
  }
}

export default connect<Props, ConnectorState>(FileExplorerCore)(FileExplorer)
